const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination (Mongoose implementation)
// @access  Public (admins also see inactive products)
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'popular']),
  query('includeInactive').optional().isIn(['true', 'false', '1', '0'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      sort = 'newest'
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1 || limit > 500) limit = 20;

    const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
    const isAdmin = Boolean(req.user && (req.user.role === 'admin' || req.user.role === 'super_admin'));

    // Always filter out inactive products by default
    // Admin can see all products only by passing includeInactive=true
    const where = {};
    if (!includeInactive || !isAdmin) {
      // Treat legacy documents without isActive as active.
      where.isActive = { $ne: false };
    }

    if (category) where.category = category;

    if (search) {
      // Escape regex input to avoid invalid patterns and regex injection
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      where.$or = [
        { name: regex },
        { sku: regex },
        { category: regex },
        { subcategory: regex },
        { brand: regex },
        { tags: regex }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.$gte = parseFloat(minPrice);
      if (maxPrice) where.price.$lte = parseFloat(maxPrice);
    }

    // Determine sort
    const sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj.price = 1; break;
      case 'price_desc':
        sortObj.price = -1; break;
      case 'popular':
        sortObj.salesCount = -1; break;
      default:
        sortObj.createdAt = -1; // newest
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(where).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(where)
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(8).lean();
    return res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Get featured products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured products' });
  }
});

// @route   GET /api/products/by-ids
// @desc    Get products by a list of ids (preserves the provided order)
// @access  Public (admins can include inactive)
router.get('/by-ids', [
  optionalAuth,
  query('ids').exists().isString(),
  query('includeInactive').optional().isIn(['true', 'false', '1', '0'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const idsRaw = String(req.query.ids || '');
    const ids = idsRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.json({ success: true, data: { products: [] } });
    }

    const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';
    const isAdmin = Boolean(req.user && (req.user.role === 'admin' || req.user.role === 'super_admin'));

    const objectIds = ids
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.json({ success: true, data: { products: [] } });
    }

    const where = { _id: { $in: objectIds } };
    if (!includeInactive || !isAdmin) {
      where.isActive = { $ne: false };
    }

    const found = await Product.find(where).lean();
    const byId = new Map(found.map(p => [String(p._id), p]));
    const products = ids.map(id => byId.get(String(id))).filter(Boolean);

    return res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Get products by ids error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    const isAdmin = Boolean(req.user && (req.user.role === 'admin' || req.user.role === 'super_admin'));
    if (!product || (product.isActive === false && !isAdmin)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count only for active (public) products
    if (product.isActive !== false) {
      product.viewCount = (product.viewCount || 0) + 1;
      await product.save();
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Admin only)
router.post('/', [
  authenticate,
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('sku').optional().trim().isLength({ min: 1, max: 50 }),
  body('description').trim().isLength({ min: 1, max: 1000 }),
  body('price').isFloat({ min: 0 }),
  body('category').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

  const productData = { ...req.body };
  try {
    const product = await Product.create(productData);
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    throw err;
  }
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Admin only)
router.put('/:id', [
  authenticate,
  requireAdmin,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('sku').optional().trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('originalPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('showOriginalPrice').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Assign only whitelisted fields
    const updatable = ['name','sku','description','price','originalPrice','showOriginalPrice','category','subcategory','sizes','colors','colorImages','sizeChartImage','inventory','isFeatured','isActive','tags','brand'];
    for (const key of updatable) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        product[key] = req.body[key];
      }
    }
    try {
      await product.save();
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
        return res.status(409).json({ success: false, message: 'SKU already exists' });
      }
      throw err;
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [authenticate, requireAdmin], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;