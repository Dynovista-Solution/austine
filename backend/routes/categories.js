const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories - list all categories with subcategories
router.get('/', async (req, res) => {
  try {
    // Load categories from DB
    const dbCats = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    // Derive categories/subcategories from existing products as a fallback/augment
    const productCatsRaw = await Product.distinct('category');
    // Normalize category names from DB docs
    const byName = new Map((dbCats || []).map(c => {
      const cleanName = String(c.name || '').trim();
      const subs = Array.isArray(c.subcategories) ? c.subcategories : [];
      const cleanSubs = Array.from(new Set(subs.map(s => String(s || '').trim()).filter(Boolean)));
      return [cleanName, { ...c, name: cleanName, subcategories: cleanSubs }];
    }));

    for (const rawName of productCatsRaw) {
      const catName = String(rawName || '').trim();
      if (!catName) continue;
      const derivedSubsRaw = await Product.distinct('subcategory', { category: rawName, subcategory: { $exists: true, $ne: '' } });
      const derivedSubs = Array.from(new Set((derivedSubsRaw || []).map(s => String(s || '').trim()).filter(Boolean)));
      if (byName.has(catName)) {
        // Merge any missing subcategories
        const c = byName.get(catName);
        const merged = Array.from(new Set([...(c.subcategories || []), ...derivedSubs])).filter(Boolean);
        c.subcategories = merged;
        byName.set(catName, c);
      } else {
        byName.set(catName, { name: catName, subcategories: derivedSubs, isActive: true });
      }
    }

    const categories = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: { categories } });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// POST /api/categories - create new category
router.post('/', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    const exists = await Category.findOne({ name: String(name).trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Category already exists' });
    const category = await Category.create({ name: String(name).trim() });
    res.json({ success: true, data: { category } });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// POST /api/categories/:name/subcategories - add a subcategory to category
router.post('/:name/subcategories', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { name } = req.params;
    const { subcategory } = req.body || {};
    if (!subcategory || !String(subcategory).trim()) return res.status(400).json({ success: false, message: 'Subcategory is required' });
    const cat = await Category.addSubcategory(name, subcategory);
    res.json({ success: true, data: { category: cat } });
  } catch (err) {
    console.error('Add subcategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to add subcategory' });
  }
});

module.exports = router;
