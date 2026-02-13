const modeRaw = (process.env.PAYU_ENV || process.env.PAYU_MODE || 'test').toLowerCase();
const isLive = ['live', 'prod', 'production'].includes(modeRaw);

module.exports = {
  // IMPORTANT:
  // Do not hardcode credentials. In production, missing credentials can cause
  // PayU errors like "Too many requests" / black screen.
  merchantKey: process.env.PAYU_MERCHANT_KEY,
  merchantSalt: process.env.PAYU_MERCHANT_SALT,
  // Allow explicit override.
  paymentUrl: process.env.PAYU_PAYMENT_URL || (isLive
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment'),
  isLive
};
