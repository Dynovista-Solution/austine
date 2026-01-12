const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  category: { type: String, required: true },
  subcategory: { type: String },
  brand: { type: String },
  images: { type: Array, default: [] },
  variants: { type: Array, default: [] },
  sizes: { type: Array, default: [] },
  colors: { type: Array, default: [] },
  colorImages: { type: Map, of: Array, default: {} }, // { "Red": [{url, type}], "Blue": [...] }
  inventory: [{
    color: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, default: 0, min: 0 }
  }],
  totalStock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  tags: { type: Array, default: [] },
  weight: { type: Number },
  dimensions: { type: Object, default: {} },
  material: { type: String },
  careInstructions: { type: String },
  seoMetaTitle: { type: String },
  seoMetaDescription: { type: String },
  seoSlug: { type: String, unique: true, sparse: true },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  reviews: { type: Array, default: [] },
  salesCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

// Virtuals / methods
productSchema.methods.getDiscountPrice = function() {
  if (this.discount > 0) {
    return Number(this.price) * (1 - Number(this.discount) / 100);
  }
  return Number(this.price);
};

productSchema.methods.getPrimaryImage = function() {
  return (this.images || []).find(img => img?.isPrimary) || (this.images || [])[0];
};

productSchema.pre('save', function(next) {
  // Calculate totalStock from inventory array
  if (Array.isArray(this.inventory) && this.inventory.length > 0) {
    this.totalStock = this.inventory.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);
  } else if (Array.isArray(this.variants) && this.variants.some(v => typeof v?.stock === 'number')) {
    // Fallback to variants stock if inventory is empty
    this.totalStock = this.variants.reduce((t, v) => t + (Number(v?.stock) || 0), 0);
  }
  next();
});

// Static helpers compatible with existing routes
productSchema.statics.getFeatured = function(limit = 8) {
  return this.find({ isActive: true, isFeatured: true }).sort({ createdAt: -1 }).limit(limit);
};

productSchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({ category, isActive: true }).sort({ createdAt: -1 }).limit(limit);
};

productSchema.statics.findByPk = function(id) {
  return this.findById(id);
};

productSchema.statics.findAll = function(opts = {}) {
  const where = opts.where || {};
  const order = opts.order || [['createdAt', 'DESC']];
  const sort = Array.isArray(order) ? Object.fromEntries(order.map(([f, dir]) => [f, dir.toUpperCase() === 'DESC' ? -1 : 1])) : order;
  const limit = opts.limit || 0;
  return this.find(where).sort(sort).limit(limit);
};

productSchema.statics.findAndCountAll = async function(opts = {}) {
  const where = opts.where || {};
  const order = opts.order || [['createdAt', 'DESC']];
  const sort = Array.isArray(order) ? Object.fromEntries(order.map(([f, dir]) => [f, dir.toUpperCase() === 'DESC' ? -1 : 1])) : order;
  const offset = opts.offset || 0;
  const limit = opts.limit || 20;
  const [rows, count] = await Promise.all([
    this.find(where).sort(sort).skip(offset).limit(limit),
    this.countDocuments(where)
  ]);
  return { rows, count };
};

// Instance update helper
productSchema.methods.update = function(updates) {
  Object.assign(this, updates);
  return this.save();
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;