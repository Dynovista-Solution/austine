const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'warehouse_user', 'admin', 'super_admin'], default: 'customer', index: true },
  isActive: { type: Boolean, default: true },
  profile: { type: Object, default: {} },
  wishlist: { type: Array, default: [] },
  cart: { type: Array, default: [] },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, { timestamps: true });

// Pre-save hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance methods
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = function() {
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  if (this.loginAttempts >= 5 && !this.lockUntil) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }
  return this.save();
};

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Statics
userSchema.statics.authenticate = async function(email, password) {
  const user = await this.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('Account is deactivated');
  if (user.isLocked) throw new Error('Account is temporarily locked due to too many failed login attempts');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLogin = new Date();
  await user.save();
  return user;
};

// Sequelize-like helpers for compatibility
userSchema.statics.findByPk = function(id, opts = {}) {
  const query = this.findById(id);
  if (opts && opts.attributes && opts.attributes.exclude) {
    const exclude = opts.attributes.exclude;
    const projection = exclude.reduce((acc, f) => (acc[f] = 0, acc), {});
    return query.select(projection);
  }
  return query;
};

// Instance update helper to mimic Sequelize's instance.update
userSchema.methods.update = function(updates) {
  Object.assign(this, updates);
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;