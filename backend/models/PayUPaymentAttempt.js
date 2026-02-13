const mongoose = require('mongoose')

const payUPaymentAttemptSchema = new mongoose.Schema(
  {
    txnid: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    items: { type: Array, required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },

    shippingAddress: { type: Object, required: true },
    billingAddress: { type: Object, required: true },

    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
)

// Auto-delete attempts after expiry
payUPaymentAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('PayUPaymentAttempt', payUPaymentAttemptSchema)
