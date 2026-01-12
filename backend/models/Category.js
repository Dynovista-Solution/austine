const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  subcategories: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.statics.ensureCategory = async function(name) {
  const clean = String(name || '').trim();
  if (!clean) throw new Error('Category name is required');
  let doc = await this.findOne({ name: clean });
  if (!doc) doc = await this.create({ name: clean });
  return doc;
};

categorySchema.statics.addSubcategory = async function(name, sub) {
  const cat = await this.ensureCategory(name);
  const subClean = String(sub || '').trim();
  if (!subClean) return cat;
  if (!(cat.subcategories || []).includes(subClean)) {
    cat.subcategories.push(subClean);
    await cat.save();
  }
  return cat;
};

module.exports = mongoose.model('Category', categorySchema);
