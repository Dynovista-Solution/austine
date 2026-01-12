const express = require('express');
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order (requires login)
// @access  Private
router.post('/', [
  authenticate,
  body('items').isArray({ min: 1 }),
  body('items.*.product').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shippingAddress.firstName').notEmpty(),
  body('shippingAddress.lastName').notEmpty(),
  body('shippingAddress.email').isEmail(),
  body('shippingAddress.phone').notEmpty(),
  body('shippingAddress.street').notEmpty(),
  body('shippingAddress.city').notEmpty(),
  body('shippingAddress.state').optional().isString(),
  body('shippingAddress.zipCode').notEmpty(),
  body('shippingAddress.country').notEmpty(),
  body('payment.method').isIn(['cod','stripe','paypal','bank_transfer']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { items, shippingAddress, billingAddress = null, payment } = req.body;

    // Validate and enrich items with product snapshots
    const enrichedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await (Product.findByPk ? Product.findByPk(item.product) : Product.findById(item.product));
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (product.isActive === false) {
        return res.status(400).json({ success: false, message: `Product is inactive: ${product.name}` });
      }
      const price = Number(product.price);
      const quantity = Number(item.quantity);
      const image = product.images?.[0]?.url || product.image || '';
      const snapshot = {
        product: product.id || product._id,
        name: product.name,
        image,
        price,
        quantity,
        size: item.size || '',
        color: item.color || item.variantLabel || '',
        subtotal: Number((price * quantity).toFixed(2))
      };
      subtotal += snapshot.subtotal;
      enrichedItems.push(snapshot);
    }

    const tax = 0;
    const shipping = 0;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    const orderData = {
      user: req.user.id || req.user._id,
      items: enrichedItems,
      subtotal,
      tax,
      shipping,
      total,
      // Payment is pending until confirmed by a real payment flow/webhook
      payment: { method: payment.method, status: 'pending' },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Order created', updatedBy: req.user.id }]
    };
    
    const order = await Order.create(orderData);

    res.status(201).json({ success: true, message: 'Order created', data: { order } });
  } catch (error) {
    console.error('Create order error:', error);
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/my
// @desc    Get current user's orders
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const orders = await Order.getUserOrders(req.user.id || req.user._id);
    res.json({ success: true, data: { orders } });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by id (owner or admin)
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const isOwner = String(order.user) === String(req.user.id || req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: { order } });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// @route   GET /api/orders
// @desc    Admin: list all orders
// @access  Private/Admin
router.get('/', [
  authenticate,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('status').optional().isString(),
  query('search').optional().isString(),
  query('dateFrom').optional().isString(),
  query('dateTo').optional().isString(),
  query('minTotal').optional().isFloat({ min: 0 }).toFloat(),
  query('maxTotal').optional().isFloat({ min: 0 }).toFloat(),
  query('sort').optional().isIn(['newest', 'oldest', 'total_asc', 'total_desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const {
      page: pageRaw,
      limit: limitRaw,
      status,
      search,
      dateFrom,
      dateTo,
      minTotal,
      maxTotal,
      sort = 'newest'
    } = req.query;

    // Keep backward-compatible defaults: 200 newest orders
    const page = pageRaw || 1;
    const limit = limitRaw || 200;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      filter.total = {};
      if (minTotal !== undefined) filter.total.$gte = minTotal;
      if (maxTotal !== undefined) filter.total.$lte = maxTotal;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00.000Z`);
        if (!Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999Z`);
        if (!Number.isNaN(to.getTime())) filter.createdAt.$lte = to;
      }
      // Clean empty createdAt
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const or = [
        { orderNumber: regex },
        { 'shippingAddress.firstName': regex },
        { 'shippingAddress.lastName': regex },
        { 'shippingAddress.email': regex },
        { 'shippingAddress.phone': regex },
        { 'items.name': regex }
      ];

      if (mongoose.Types.ObjectId.isValid(trimmedSearch)) {
        or.push({ _id: new mongoose.Types.ObjectId(trimmedSearch) });
      }

      filter.$or = or;
    }

    const sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj.createdAt = 1;
        break;
      case 'total_asc':
        sortObj.total = 1;
        break;
      case 'total_desc':
        sortObj.total = -1;
        break;
      default:
        sortObj.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit))
        }
      }
    });
  } catch (error) {
    console.error('Admin list orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Admin: update order status
// @access  Private/Admin
router.put('/:id/status', [
  authenticate,
  requireAdmin,
  body('status').isIn(['pending','confirmed','processing','shipped','delivered','cancelled','refunded']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { status, note = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;

    // Keep payment status loosely in sync for common admin actions
    if (status === 'refunded') {
      order.payment = order.payment || { method: 'cod', status: 'pending' };
      order.payment.status = 'refunded';
    }

    order.statusHistory.push({
      status,
      note: note || `Status changed to ${status}`,
      updatedBy: req.user.id || req.user._id
    });
    await order.save();

    res.json({ success: true, message: 'Order status updated', data: { order } });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

module.exports = router;