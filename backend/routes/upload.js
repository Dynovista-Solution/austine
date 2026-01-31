const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Resolve a consistent uploads directory under backend/uploads and ensure it exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES ?
    process.env.ALLOWED_FILE_TYPES.split(',') :
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  }
});

// Separate multer instance for video uploads (larger size, video mimetypes)
const videoFileFilter = (req, file, cb) => {
  const allowedVideoTypes = process.env.ALLOWED_VIDEO_TYPES ?
    process.env.ALLOWED_VIDEO_TYPES.split(',') :
    ['video/mp4', 'video/webm', 'video/ogg'];
  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed video types: ${allowedVideoTypes.join(', ')}`), false);
  }
};

const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_FILE_SIZE) || 104857600 // 100MB default
  }
});

// @route   POST /api/upload/image
// @desc    Upload a single image
// @access  Private (Admin only)
router.post('/image', [authenticate, requireAdmin, upload.single('image')], (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Return the file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/images
// @desc    Upload multiple images
// @access  Private (Admin only)
router.post('/images', [authenticate, requireAdmin, upload.array('images', 10)], (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: { files: uploadedFiles }
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/video
// @desc    Upload a single video
// @access  Private (Admin only)
router.post('/video', [authenticate, requireAdmin, uploadVideo.single('video')], (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ success: false, message: 'Video upload failed' });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete an uploaded file
// @access  Private (Admin only)
router.delete('/:filename', [authenticate, requireAdmin], async (req, res) => {
  try {
    const fsPromises = require('fs').promises;

    const filename = String(req.params.filename || '').trim();
    const safeName = path.basename(filename);
    // Reject empty names and any attempt to include path separators
    if (!safeName || safeName !== filename) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filePath = path.join(uploadsDir, safeName);

    // Check if file exists
    try {
      await fsPromises.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    await fsPromises.unlink(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

module.exports = router;