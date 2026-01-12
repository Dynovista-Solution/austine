const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ROLES = ['customer', 'premium_customer', 'admin', 'super_admin'];
const PROFILE_FIELDS = ['firstName', 'lastName', 'address', 'city', 'postal', 'country', 'phone'];

const handleValidation = (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			message: 'Validation errors',
			errors: errors.array()
		});
	}
	return null;
};

const sanitizeProfile = (profile = {}) => {
	if (!profile || typeof profile !== 'object') return {};
	const sanitized = {};
	PROFILE_FIELDS.forEach((field) => {
		if (profile[field] !== undefined) {
			sanitized[field] = typeof profile[field] === 'string' ? profile[field].trim() : profile[field];
		}
	});
	return sanitized;
};

const orderStatsForUsers = async (ids = []) => {
	if (!ids.length) return {};
	const objectIds = ids
		.map((id) => {
			if (id instanceof mongoose.Types.ObjectId) return id;
			if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
			return null;
		})
		.filter(Boolean);

	if (!objectIds.length) return {};

	const stats = await Order.aggregate([
		{ $match: { user: { $in: objectIds } } },
		{
			$group: {
				_id: '$user',
				ordersCount: { $sum: 1 },
				totalSpent: { $sum: '$total' },
				lastOrder: { $max: '$createdAt' }
			}
		}
	]);

	return stats.reduce((acc, entry) => {
		acc[String(entry._id)] = {
			ordersCount: entry.ordersCount || 0,
			totalSpent: entry.totalSpent || 0,
			lastOrderAt: entry.lastOrder || null
		};
		return acc;
	}, {});
};

const serializeUser = (userDoc, stats = {}) => {
	if (!userDoc) return null;
	const user = userDoc.toObject ? userDoc.toObject() : userDoc;
	const id = String(user._id || user.id);
	const profile = user.profile || {};
	const statBlock = stats[id] || {};

	return {
		id,
		name: user.name,
		email: user.email,
		role: user.role,
		status: user.isActive === false ? 'inactive' : 'active',
		isActive: user.isActive !== false,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		lastLogin: user.lastLogin,
		profile,
		ordersCount: statBlock.ordersCount || 0,
		totalSpent: statBlock.totalSpent || 0,
		lastOrderAt: statBlock.lastOrderAt || null
	};
};

router.get(
	'/',
	authenticate,
	requireAdmin,
	[
		query('page').optional().isInt({ min: 1 }).toInt(),
		query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
		query('status').optional().isIn(['active', 'inactive']),
		query('role').optional().isString(),
		query('search').optional().isString(),
		query('sort').optional().isString(),
		query('order').optional().isIn(['asc', 'desc'])
	],
	async (req, res) => {
		const validationError = handleValidation(req, res);
		if (validationError) return validationError;

		try {
			const {
				page = 1,
				limit = 20,
				status,
				role,
				search = '',
				sort = 'createdAt',
				order = 'desc'
			} = req.query;

			const queryFilter = {};
			if (status) {
				queryFilter.isActive = status === 'active';
			}
			if (role) {
				queryFilter.role = role;
			}
			if (search) {
				const regex = new RegExp(search.trim(), 'i');
				queryFilter.$or = [{ name: regex }, { email: regex }];
			}

			const allowedSorts = ['name', 'email', 'createdAt', 'lastLogin'];
			const sortField = allowedSorts.includes(sort) ? sort : 'createdAt';
			const sortOrder = order === 'asc' ? 1 : -1;

			const skip = (page - 1) * limit;

			const [users, total] = await Promise.all([
				User.find(queryFilter)
					.select('-password -__v -loginAttempts -lockUntil')
					.sort({ [sortField]: sortOrder })
					.skip(skip)
					.limit(limit)
					.lean(),
				User.countDocuments(queryFilter)
			]);

			const statsMap = await orderStatsForUsers(users.map((user) => user._id));
			const items = users.map((user) => serializeUser(user, statsMap));

			return res.json({
				success: true,
				data: {
					users: items,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.max(1, Math.ceil(total / limit))
					}
				}
			});
		} catch (error) {
			console.error('Get users error:', error);
			return res.status(500).json({
				success: false,
				message: 'Failed to load users'
			});
		}
	}
);

router.get('/:id', authenticate, requireAdmin, async (req, res) => {
	try {
		const user = await User.findById(req.params.id).select('-password -__v -loginAttempts -lockUntil');
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		const statsMap = await orderStatsForUsers([user._id]);
		return res.json({
			success: true,
			data: {
				user: serializeUser(user, statsMap)
			}
		});
	} catch (error) {
		console.error('Get user error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to load user'
		});
	}
});

router.post(
	'/',
	authenticate,
	requireAdmin,
	[
		body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
		body('email').isEmail().withMessage('Valid email is required'),
		body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
		body('role').optional().isIn(ALLOWED_ROLES),
		body('status').optional().isIn(['active', 'inactive'])
	],
	async (req, res) => {
		const validationError = handleValidation(req, res);
		if (validationError) return validationError;

		try {
			const { name, email, password, role = 'customer', status = 'active', profile = {} } = req.body;

			const existing = await User.findOne({ email: email.toLowerCase() });
			if (existing) {
				return res.status(400).json({
					success: false,
					message: 'User with this email already exists'
				});
			}

			const user = await User.create({
				name: name.trim(),
				email: email.toLowerCase(),
				password,
				role,
				isActive: status !== 'inactive',
				profile: sanitizeProfile(profile)
			});

			return res.status(201).json({
				success: true,
				message: 'User created successfully',
				data: {
					user: serializeUser(user, { [String(user._id)]: { ordersCount: 0, totalSpent: 0, lastOrderAt: null } })
				}
			});
		} catch (error) {
			console.error('Create user error:', error);
			return res.status(500).json({
				success: false,
				message: 'Failed to create user'
			});
		}
	}
);

router.put(
	'/:id',
	authenticate,
	requireAdmin,
	[
		body('name').optional().trim().isLength({ min: 2, max: 100 }),
		body('email').optional().isEmail(),
		body('password').optional().isLength({ min: 6 }),
		body('role').optional().isIn(ALLOWED_ROLES),
		body('status').optional().isIn(['active', 'inactive'])
	],
	async (req, res) => {
		const validationError = handleValidation(req, res);
		if (validationError) return validationError;

		try {
			const { id } = req.params;
			const { name, email, password, role, status, profile } = req.body;

			const user = await User.findById(id);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'User not found'
				});
			}

			if (email && email.toLowerCase() !== user.email) {
				const existing = await User.findOne({ email: email.toLowerCase() });
				if (existing && String(existing._id) !== String(id)) {
					return res.status(400).json({
						success: false,
						message: 'Email is already in use'
					});
				}
				user.email = email.toLowerCase();
			}

			if (name) {
				user.name = name.trim();
			}

			if (role) {
				user.role = role;
			}

			if (status) {
				user.isActive = status === 'active';
			}

			if (profile && typeof profile === 'object') {
				user.profile = {
					...(user.profile || {}),
					...sanitizeProfile(profile)
				};
			}

			if (password) {
				user.password = password;
			}

			await user.save();

			const statsMap = await orderStatsForUsers([user._id]);
			return res.json({
				success: true,
				message: 'User updated successfully',
				data: {
					user: serializeUser(user, statsMap)
				}
			});
		} catch (error) {
			console.error('Update user error:', error);
			return res.status(500).json({
				success: false,
				message: 'Failed to update user'
			});
		}
	}
);

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		if (String(req.user._id) === String(id)) {
			return res.status(400).json({
				success: false,
				message: 'You cannot delete your own account'
			});
		}

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		if (user.role === 'super_admin') {
			return res.status(403).json({
				success: false,
				message: 'Super admin accounts cannot be deleted'
			});
		}

		await user.deleteOne();

		return res.json({
			success: true,
			message: 'User deleted successfully'
		});
	} catch (error) {
		console.error('Delete user error:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to delete user'
		});
	}
});

module.exports = router;