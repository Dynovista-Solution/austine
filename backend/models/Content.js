const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ['homepage', 'branding', 'social_media', 'navigation', 'footer', 'settings'], unique: true, required: true, index: true },
  data: { type: Object, default: {} },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Statics
contentSchema.statics.getByType = function(type) {
  return this.findOne({ type });
};

contentSchema.statics.updateContent = async function(type, data, updatedBy = null) {
  const existing = await this.findOne({ type });
  if (!existing) {
    return this.create({ type, data, updatedBy });
  }
  existing.data = { ...existing.data, ...data };
  if (updatedBy) existing.updatedBy = updatedBy;
  await existing.save();
  return existing;
};

// Instance
contentSchema.methods.getFormattedData = function() {
  const formatted = { type: this.type, data: { ...this.data } };
  if (this.type === 'social_media' && formatted.data.socialMedia) {
    formatted.data.socialMedia = formatted.data.socialMedia.map(s => ({
      platform: s.platform,
      url: s.url,
      icon: s.icon || (s.platform || '').toLowerCase(),
      enabled: s.enabled !== false
    }));
  }
  return formatted;
};

const Content = mongoose.model('Content', contentSchema);
module.exports = Content;