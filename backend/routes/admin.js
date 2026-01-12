const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Basic admin dashboard stats
// @access  Private (Admin)
router.get('/stats', [authenticate, requireAdmin], async (req, res) => {
  try {
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    const [
      productsTotal,
      productsActive,
      usersTotal,
      ordersTotal,
      ordersByStatus,
      revenueAgg,
      recentOrders
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: { $ne: false } }),
      Order.countDocuments({}),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        {
          $facet: {
            paidAllTime: [
              { $match: { 'payment.status': 'paid' } },
              { $group: { _id: null, total: { $sum: '$total' } } }
            ],
            paidLast30Days: [
              { $match: { 'payment.status': 'paid', createdAt: { $gte: last30Days } } },
              { $group: { _id: null, total: { $sum: '$total' } } }
            ]
          }
        }
      ]),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .select('orderNumber total status payment.status createdAt shippingAddress.firstName shippingAddress.lastName shippingAddress.email')
        .lean()
    ]);

    const byStatus = Array.isArray(ordersByStatus)
      ? ordersByStatus.reduce((acc, row) => {
          acc[String(row._id)] = row.count;
          return acc;
        }, {})
      : {};

    const paidAllTime = revenueAgg?.[0]?.paidAllTime?.[0]?.total || 0;
    const paidLast30Days = revenueAgg?.[0]?.paidLast30Days?.[0]?.total || 0;

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
          paidAllTime,
          paidLast30Days
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
