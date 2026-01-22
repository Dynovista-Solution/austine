const express = require('express');
const Content = require('../models/Content');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/content/:type
// @desc    Get content by type
// @access  Public
router.get('/:type', async (req, res) => {
  try {
    const content = await Content.getByType(req.params.type);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content.getFormattedData()
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @route   PUT /api/content/:type
// @desc    Update content by type
// @access  Private (Admin only)
router.put('/:type', [authenticate, requireAdmin], async (req, res) => {
  try {
    const content = await Content.updateContent(
      req.params.type,
      req.body,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content.getFormattedData()
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content'
    });
  }
});

// @route   GET /api/content
// @desc    Get all content types
// @access  Public
router.get('/', async (req, res) => {
  try {
  const contents = await Content.find();
  const formattedContents = contents.map(content => content.getFormattedData());

    res.json({
      success: true,
      data: { contents: formattedContents }
    });
  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

module.exports = router;