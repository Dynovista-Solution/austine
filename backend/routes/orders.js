const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const PayUPaymentAttempt = require('../models/PayUPaymentAttempt');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');
const payuConfig = require('../config/payu');
const { getDefaults, sendMail } = require('../utils/mailer');

const router = express.Router();

// @route   GET /api/orders/payu/config
// @desc    Check whether PayU is configured (safe: does not expose secrets)
// @access  Public
router.get('/payu/config', (req, res) => {
  const configured = Boolean(payuConfig.merchantKey && payuConfig.merchantSalt && payuConfig.paymentUrl);
  return res.json({
    success: true,
    data: {
      configured,
      isLive: Boolean(payuConfig.isLive),
      paymentUrl: payuConfig.paymentUrl || null
    }
  });
});

function assertPayUConfigured() {
  if (!payuConfig.merchantKey || !payuConfig.merchantSalt) {
    const err = new Error('PayU is not configured. Set PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT (and optionally PAYU_ENV=live/test).');
    err.statusCode = 500;
    throw err;
  }
  if (!payuConfig.paymentUrl) {
    const err = new Error('PayU payment URL is missing. Set PAYU_PAYMENT_URL or PAYU_ENV.');
    err.statusCode = 500;
    throw err;
  }
}

async function buildOrderSnapshotsAndTotals(items) {
  const enrichedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await (Product.findByPk ? Product.findByPk(item.product) : Product.findById(item.product));
    if (!product) {
      const err = new Error(`Product not found: ${item.product}`);
      err.statusCode = 400;
      throw err;
    }
    if (product.isActive === false) {
      const err = new Error(`Product is inactive: ${product.name}`);
      err.statusCode = 400;
      throw err;
    }

    const price = Number(product.price);
    const quantity = Number(item.quantity);

    let image = '';
    const selectedColor = item.color || item.variantLabel || '';

    if (product.colorImages) {
      if (selectedColor) {
        const colorMedia = typeof product.colorImages.get === 'function'
          ? product.colorImages.get(selectedColor)
          : product.colorImages[selectedColor];

        if (Array.isArray(colorMedia) && colorMedia.length > 0) {
          const firstImage = colorMedia.find(m => !m.type || m.type === 'image');
          if (firstImage?.url) image = firstImage.url;
        }
      }

      if (!image) {
        const colorKeys = typeof product.colorImages.keys === 'function'
          ? Array.from(product.colorImages.keys())
          : Object.keys(product.colorImages);

        for (const color of colorKeys) {
          const colorMedia = typeof product.colorImages.get === 'function'
            ? product.colorImages.get(color)
            : product.colorImages[color];

          if (Array.isArray(colorMedia) && colorMedia.length > 0) {
            const firstImage = colorMedia.find(m => !m.type || m.type === 'image');
            if (firstImage?.url) {
              image = firstImage.url;
              break;
            }
          }
        }
      }
    }

    if (!image) {
      image = product.images?.[0]?.url || product.image || '';
    }

    const snapshot = {
      product: product.id || product._id,
      name: product.name,
      sku: product.sku || '',
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

  const tax = Number((subtotal * (5 / 105)).toFixed(2));
  const shipping = 0;
  const total = Number(subtotal.toFixed(2));

  return { enrichedItems, subtotal, tax, shipping, total };
}

async function generateUniqueTxnId() {
  // Generate order-number-like txnid so we can reuse it as orderNumber on success.
  for (let i = 0; i < 5; i++) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const txnid = `ORD${timestamp}${random}`;
    const [existingOrder, existingAttempt] = await Promise.all([
      Order.findOne({ orderNumber: txnid }).select('_id').lean(),
      PayUPaymentAttempt.findOne({ txnid }).select('_id').lean()
    ]);
    if (!existingOrder && !existingAttempt) return txnid;
  }
  // Fallback if extremely unlucky
  return `ORD${Date.now()}${Math.floor(Math.random() * 100000)}`;
}

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
  body('payment.method').isIn(['cod','stripe','paypal','bank_transfer','payu']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { items, shippingAddress, billingAddress = null, payment } = req.body;

    // IMPORTANT: For PayU we only create the Order after payment success.
    if (payment?.method === 'payu') {
      return res.status(400).json({
        success: false,
        message: 'PayU orders are created only after successful payment. Use /api/orders/payu/initiate.'
      });
    }

    const { enrichedItems, subtotal, tax, shipping, total } = await buildOrderSnapshotsAndTotals(items);

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
      statusHistory: [{
        status: 'pending',
        note: payment.method === 'payu' ? 'Checkout started (PayU payment pending)' : 'Order created',
        updatedBy: req.user.id
      }]
    };
    
    const order = await Order.create(orderData);

    // Fire-and-forget emails (do not block order creation)
    try {
      const { storeName, ownerEmail, frontendUrl } = getDefaults();
      const customerEmail = order?.shippingAddress?.email;
      const orderNumber = order?.orderNumber || String(order?._id || '');
      const itemsText = Array.isArray(order?.items)
        ? order.items.map(i => `- ${i.name} x${i.quantity} (${i.price})`).join('\n')
        : '';

      setImmediate(() => {
        const tasks = [];

        if (customerEmail) {
          tasks.push(sendMail({
            to: customerEmail,
            subject: `Order received: ${orderNumber}`,
            text: `Thanks for your order!\n\nOrder: ${orderNumber}\nTotal: ${order.total}\n\nItems:\n${itemsText}\n\nTrack your order: ${frontendUrl}/orders\n\n${storeName}`,
            html: `<p>Thanks for your order!</p><p><b>Order:</b> ${orderNumber}<br/><b>Total:</b> ${order.total}</p><p><b>Items:</b><br/>${(Array.isArray(order?.items) ? order.items.map(i => `${i.name} x${i.quantity}`).join('<br/>') : '')}</p><p>Track your order: <a href="${frontendUrl}/orders">${frontendUrl}/orders</a></p><p>${storeName}</p>`
          }));
        }

        if (ownerEmail) {
          tasks.push(sendMail({
            to: ownerEmail,
            subject: `New order: ${orderNumber}`,
            text: `A new order was placed.\n\nOrder: ${orderNumber}\nCustomer: ${order?.shippingAddress?.firstName || ''} ${order?.shippingAddress?.lastName || ''}\nEmail: ${customerEmail || '(missing)'}\nTotal: ${order.total}\n\nItems:\n${itemsText}`,
            html: `<p>A new order was placed.</p><ul><li><b>Order:</b> ${orderNumber}</li><li><b>Customer:</b> ${(order?.shippingAddress?.firstName || '')} ${(order?.shippingAddress?.lastName || '')}</li><li><b>Email:</b> ${customerEmail || '(missing)'}</li><li><b>Total:</b> ${order.total}</li></ul><p><b>Items:</b><br/>${(Array.isArray(order?.items) ? order.items.map(i => `${i.name} x${i.quantity}`).join('<br/>') : '')}</p>`
          }));
        }

        Promise.allSettled(tasks).then((results) => {
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            console.warn('Order email failed:', failures.map(f => f.reason?.message || String(f.reason)));
          }
        }).catch(() => {});
      });
    } catch (e) {
      console.warn('Order email scheduling failed:', e?.message || e);
    }

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

// @route   POST /api/orders/payu/initiate
// @desc    Start PayU checkout (creates a temporary payment attempt; NO Order is created yet)
// @access  Private
router.post('/payu/initiate', [
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
  body('shippingAddress.country').notEmpty()
], async (req, res) => {
  try {
    assertPayUConfigured();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { items, shippingAddress, billingAddress = null } = req.body;

    const { enrichedItems, subtotal, tax, shipping, total } = await buildOrderSnapshotsAndTotals(items);

    const txnid = await generateUniqueTxnId();
    const amount = Number(total).toFixed(2);
    const productinfo = 'Order Payment';
    const firstname = shippingAddress.firstName;
    const email = shippingAddress.email;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await PayUPaymentAttempt.create({
      txnid,
      user: req.user.id || req.user._id,
      items: enrichedItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      expiresAt
    });

    const hashString = `${payuConfig.merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${payuConfig.merchantSalt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    return res.json({
      success: true,
      data: {
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        key: payuConfig.merchantKey,
        hash,
        paymentUrl: payuConfig.paymentUrl
      }
    });
  } catch (error) {
    console.error('PayU initiate error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Failed to initiate PayU payment' });
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

// @route   GET /api/orders/number/:orderNumber
// @desc    Get order by order number (for payment confirmation)
// @access  Public (payment confirmation)
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
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
    order.payment = order.payment || { method: 'cod', status: 'pending' };
    
    if (status === 'delivered') {
      // Mark payment as paid when order is delivered
      order.payment.status = 'paid';
      if (!order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
    } else if (status === 'refunded') {
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

// @route   POST /api/orders/payment/hash
// @desc    Generate PayU payment hash
// @access  Private
router.post('/payment/hash', authenticate, async (req, res) => {
  try {
    assertPayUConfigured();
    const { txnid, amount, productinfo, firstname, email } = req.body;
    
    if (!txnid || !amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }
    
    const hashString = `${payuConfig.merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${payuConfig.merchantSalt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    res.json({ 
      success: true, 
      hash,
      key: payuConfig.merchantKey,
      paymentUrl: payuConfig.paymentUrl
    });
  } catch (error) {
    console.error('Hash generation error:', error);
    res.status(500).json({ success: false, message: 'Hash generation failed' });
  }
});

// @route   POST /api/orders/payment/success
// @desc    PayU Success Callback
// @access  Public
router.post('/payment/success', async (req, res) => {
  try {
    const { txnid, status, amount, productinfo, firstname, email, mihpayid, hash } = req.body;

    if (!payuConfig.merchantKey || !payuConfig.merchantSalt) {
      console.error('PayU callback received but PAYU_MERCHANT_KEY/SALT not configured');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?txnid=${txnid || ''}`);
    }
    
    // Verify hash for security
    const verifyHashString = `${payuConfig.merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${payuConfig.merchantKey}`;
    const verifyHash = crypto.createHash('sha512').update(verifyHashString).digest('hex');
    
    if (hash === verifyHash && status === 'success') {
      // Idempotency: if order already exists, just ensure it is marked paid.
      let order = await Order.findOne({ orderNumber: txnid });
      if (order) {
        order.payment = order.payment || { method: 'payu', status: 'pending' };
        order.payment.method = 'payu';
        order.payment.status = 'paid';
        order.payment.transactionId = mihpayid;
        order.payment.paidAt = new Date();
        await order.save();

        // Fire-and-forget emails (do not block redirect)
        try {
          const { storeName, ownerEmail, frontendUrl } = getDefaults();
          const customerEmail = order?.shippingAddress?.email;
          const orderNumber = order?.orderNumber || txnid;
          const itemsText = Array.isArray(order?.items)
            ? order.items.map(i => `- ${i.name} x${i.quantity} (${i.price})`).join('\n')
            : '';

          setImmediate(() => {
            const tasks = [];
            if (customerEmail) {
              tasks.push(sendMail({
                to: customerEmail,
                subject: `Payment received: ${orderNumber}`,
                text: `Your payment was successful.\n\nOrder: ${orderNumber}\nTotal: ${order.total}\n\nItems:\n${itemsText}\n\nTrack your order: ${frontendUrl}/orders\n\n${storeName}`
              }));
            }
            if (ownerEmail) {
              tasks.push(sendMail({
                to: ownerEmail,
                subject: `PayU payment received: ${orderNumber}`,
                text: `Payment received for order ${orderNumber}.\nCustomer: ${order?.shippingAddress?.firstName || ''} ${order?.shippingAddress?.lastName || ''}\nEmail: ${customerEmail || '(missing)'}\nTotal: ${order.total}\n\nItems:\n${itemsText}`
              }));
            }
            Promise.allSettled(tasks).catch(() => {});
          });
        } catch (e) {
          console.warn('PayU email scheduling failed:', e?.message || e);
        }

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation/${txnid}?success=true`);
      }

      const attempt = await PayUPaymentAttempt.findOne({ txnid });
      if (!attempt) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?txnid=${txnid}`);
      }

      order = await Order.create({
        orderNumber: txnid,
        user: attempt.user,
        items: attempt.items,
        subtotal: attempt.subtotal,
        tax: attempt.tax,
        shipping: attempt.shipping,
        total: attempt.total,
        payment: { method: 'payu', status: 'paid', transactionId: mihpayid, paidAt: new Date() },
        shippingAddress: attempt.shippingAddress,
        billingAddress: attempt.billingAddress,
        status: 'pending',
        statusHistory: [{ status: 'pending', note: 'Payment successful (PayU)', updatedBy: null }]
      });

      await PayUPaymentAttempt.deleteOne({ _id: attempt._id });

      // Fire-and-forget emails (do not block redirect)
      try {
        const { storeName, ownerEmail, frontendUrl } = getDefaults();
        const customerEmail = order?.shippingAddress?.email || email;
        const orderNumber = order?.orderNumber || txnid;
        const itemsText = Array.isArray(order?.items)
          ? order.items.map(i => `- ${i.name} x${i.quantity} (${i.price})`).join('\n')
          : '';

        setImmediate(() => {
          const tasks = [];
          if (customerEmail) {
            tasks.push(sendMail({
              to: customerEmail,
              subject: `Order confirmed: ${orderNumber}`,
              text: `Thanks for your order! Payment was successful.\n\nOrder: ${orderNumber}\nTotal: ${order.total}\n\nItems:\n${itemsText}\n\nTrack your order: ${frontendUrl}/orders\n\n${storeName}`
            }));
          }
          if (ownerEmail) {
            tasks.push(sendMail({
              to: ownerEmail,
              subject: `New paid order (PayU): ${orderNumber}`,
              text: `A PayU order was paid.\n\nOrder: ${orderNumber}\nCustomer: ${order?.shippingAddress?.firstName || ''} ${order?.shippingAddress?.lastName || ''}\nEmail: ${customerEmail || '(missing)'}\nTotal: ${order.total}\n\nItems:\n${itemsText}`
            }));
          }
          Promise.allSettled(tasks).catch(() => {});
        });
      } catch (e) {
        console.warn('PayU email scheduling failed:', e?.message || e);
      }

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation/${txnid}?success=true`);
    }

    // Hash mismatch or non-success status
    try { await PayUPaymentAttempt.deleteOne({ txnid }); } catch {}
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?txnid=${txnid}`);
  } catch (error) {
    console.error('Payment success callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed`);
  }
});

// @route   POST /api/orders/payment/failure
// @desc    PayU Failure Callback
// @access  Public
router.post('/payment/failure', async (req, res) => {
  try {
    const { txnid } = req.body;
    // If an order exists (rare with the new flow), mark it failed/cancelled.
    const order = await Order.findOne({ orderNumber: txnid });
    if (order) {
      order.payment = order.payment || { method: 'payu', status: 'pending' };
      order.payment.method = 'payu';
      order.payment.status = 'failed';
      order.status = 'cancelled';
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({ status: 'cancelled', note: 'Payment failed/cancelled (PayU)', updatedBy: null });
      await order.save();
    }

    // Always delete the attempt so no ghost "pending" attempts remain.
    await PayUPaymentAttempt.deleteOne({ txnid });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?txnid=${txnid}`);
  } catch (error) {
    console.error('Payment failure callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed`);
  }
});

module.exports = router;