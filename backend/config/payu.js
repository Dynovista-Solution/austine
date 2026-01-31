module.exports = {
  merchantKey: process.env.PAYU_MERCHANT_KEY || '6iXFFA',
  merchantSalt: process.env.PAYU_MERCHANT_SALT || '0BBWs0tY4BtB9fsY6VCqaDj8g4LtB6hb',
  paymentUrl: process.env.NODE_ENV === 'production' 
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment'
};
