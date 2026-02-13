const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendMail, getDefaults } = require('../utils/mailer');

const router = express.Router();

// @route   POST /api/admin/test-email
// @desc    Send a test email (verifies Mailgun/SMTP configuration)
// @access  Private (Admin)
router.post('/test-email', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { ownerEmail, storeName } = getDefaults();
    const to = String(req.body?.to || ownerEmail || '').trim();
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'No recipient specified. Provide { to } or set STORE_OWNER_EMAIL.'
      });
    }

    const result = await sendMail({
      to,
      subject: `Test email from ${storeName}`,
      text: `If you received this, your email provider is configured correctly.\n\nTime: ${new Date().toISOString()}`
    });

    return res.json({
      success: true,
      message: result?.skipped ? 'Email skipped (provider disabled/unconfigured)' : 'Email sent',
      data: {
        skipped: Boolean(result?.skipped),
        provider: result?.provider,
        to
      }
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Basic admin dashboard stats
// @access  Private (Admin)
router.get('/stats', [authenticate, requireAdmin], async (req, res) => {
  try {
    const now = new Date();
    
    // Get date range from query params or use defaults
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : now;
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);
    
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);

    const [
      productsTotal,
      productsActive,
      usersTotal,
      ordersTotal,
      ordersByStatus,
      revenueAgg,
      recentOrders,
      customerStats,
      newCustomersLast30Days,
      dailyCustomerStats
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: { $ne: false } }),
      // Filter orders by date range
      Order.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      // Filter order status by date range
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Filter revenue by date range
      Order.aggregate([
        {
          $facet: {
            paidInRange: [
              { 
                $match: { 
                  'payment.status': 'paid',
                  createdAt: { $gte: startDate, $lte: endDate }
                }
              },
              { $group: { _id: null, total: { $sum: '$total' } } }
            ],
            paidAllTime: [
              { $match: { 'payment.status': 'paid' } },
              { $group: { _id: null, total: { $sum: '$total' } } }
            ]
          }
        }
      ]),
      // Filter recent orders by date range
      Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('orderNumber total status payment.status createdAt shippingAddress.firstName shippingAddress.lastName shippingAddress.email')
        .lean(),
      // Customer statistics: new vs repeat (filtered by date range)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$user',
            orderCount: { $sum: 1 },
            firstOrder: { $min: '$createdAt' }
          }
        },
        {
          $facet: {
            newCustomers: [
              { $match: { orderCount: 1 } },
              { $count: 'count' }
            ],
            repeatCustomers: [
              { $match: { orderCount: { $gt: 1 } } },
              { $count: 'count' }
            ]
          }
        }
      ]),
      // New customers in selected date range
      User.countDocuments({ 
        role: 'customer',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      // Daily customer registration for selected date range
      User.aggregate([
        {
          $match: {
            role: 'customer',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const byStatus = Array.isArray(ordersByStatus)
      ? ordersByStatus.reduce((acc, row) => {
          acc[String(row._id)] = row.count;
          return acc;
        }, {})
      : {};

    const paidInRange = revenueAgg?.[0]?.paidInRange?.[0]?.total || 0;
    const paidAllTime = revenueAgg?.[0]?.paidAllTime?.[0]?.total || 0;
    
    const newCustomers = customerStats?.[0]?.newCustomers?.[0]?.count || 0;
    const repeatCustomers = customerStats?.[0]?.repeatCustomers?.[0]?.count || 0;

    return res.json({
      success: true,
      data: {
        products: {
          total: productsTotal,
          active: productsActive,
          inactive: Math.max(0, productsTotal - productsActive)
        },
        users: {
          total: usersTotal
        },
        orders: {
          total: ordersTotal,
          byStatus
        },
        revenue: {
          paidInRange,
          paidAllTime
        },
        customers: {
          new: newCustomers,
          repeat: repeatCustomers,
          newLast30Days: newCustomersLast30Days,
          dailyRegistrations: dailyCustomerStats
        },
        recentOrders: recentOrders.map(o => ({
          _id: o._id,
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          paymentStatus: o.payment?.status,
          createdAt: o.createdAt,
          customer: {
            name: `${o.shippingAddress?.firstName || ''} ${o.shippingAddress?.lastName || ''}`.trim(),
            email: o.shippingAddress?.email || ''
          }
        }))
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

module.exports = router;
