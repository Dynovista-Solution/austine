const express = require('express')
const { body, validationResult, query, param } = require('express-validator')
const LookbookPost = require('../models/LookbookPost')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// List posts
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() })
    }
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 12)
    const search = req.query.search?.trim()
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')
    const where = isAdmin ? {} : { isPublished: true }
    if (search) {
      where.title = { $regex: search, $options: 'i' }
    }
    const total = await LookbookPost.countDocuments(where)
    const posts = await LookbookPost.find(where)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    res.json({
      success: true,
      data: {
        page,
        limit,
        total,
        posts: posts.map(p => p.toPublicJSON(req.user?._id))
      }
    })
  } catch (err) {
    console.error('List lookbook posts error', err)
    res.status(500).json({ success: false, message: 'Failed to load lookbook posts' })
  }
})

// Get single
router.get('/:id', [ param('id').isMongoId() ], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() })
    }
    const post = await LookbookPost.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
    if (!post.isPublished && !(req.user && (req.user.role === 'admin' || req.user.role === 'super_admin'))) {
      return res.status(403).json({ success: false, message: 'Not authorized to view draft' })
    }
    res.json({ success: true, data: { post: post.toPublicJSON(req.user?._id), comments: post.comments } })
  } catch (err) {
    console.error('Get lookbook post error', err)
    res.status(500).json({ success: false, message: 'Failed to load post' })
  }
})

// Create post
router.post('/', [
  authenticate,
  requireAdmin,
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('content').trim().isLength({ min: 10 }),
  body('images').optional().isArray({ max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() })
    const { title, content, images = [], tags = [], isPublished = true } = req.body
    const post = await LookbookPost.create({ title, content, images, tags, isPublished, author: req.user._id })
    res.status(201).json({ success: true, message: 'Post created', data: { post: post.toPublicJSON(req.user._id) } })
  } catch (err) {
    console.error('Create lookbook post error', err)
    res.status(500).json({ success: false, message: 'Failed to create post' })
  }
})

// Update post
router.put('/:id', [
  authenticate,
  requireAdmin,
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('content').optional().trim().isLength({ min: 10 }),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() })
    const updates = (({ title, content, images, tags, isPublished }) => ({ title, content, images, tags, isPublished }))(req.body)
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])
    const post = await LookbookPost.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
    res.json({ success: true, message: 'Post updated', data: { post: post.toPublicJSON(req.user._id) } })
  } catch (err) {
    console.error('Update lookbook post error', err)
    res.status(500).json({ success: false, message: 'Failed to update post' })
  }
})

// Delete post
router.delete('/:id', [ authenticate, requireAdmin, param('id').isMongoId() ], async (req, res) => {
  try {
    const post = await LookbookPost.findByIdAndDelete(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
    res.json({ success: true, message: 'Post deleted' })
  } catch (err) {
    console.error('Delete lookbook post error', err)
    res.status(500).json({ success: false, message: 'Failed to delete post' })
  }
})

// Reaction
router.post('/:id/reaction', [ authenticate, param('id').isMongoId(), body('type').isIn(['like','dislike']) ], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() })
    const post = await LookbookPost.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
    const userId = req.user._id
    post.likes = post.likes.filter(id => String(id) !== String(userId))
    post.dislikes = post.dislikes.filter(id => String(id) !== String(userId))
    if (req.body.type === 'like') post.likes.push(userId)
    else post.dislikes.push(userId)
    await post.save()
    res.json({ success: true, data: { post: post.toPublicJSON(userId) } })
  } catch (err) {
    console.error('Reaction error', err)
    res.status(500).json({ success: false, message: 'Failed to react' })
  }
})

// Add comment
router.post('/:id/comments', [ authenticate, param('id').isMongoId(), body('content').trim().isLength({ min: 1, max: 2000 }) ], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() })
    const post = await LookbookPost.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
    post.comments.push({ user: req.user._id, content: req.body.content })
    await post.save()
    res.status(201).json({ success: true, message: 'Comment added', data: { comments: post.comments } })
  } catch (err) {
    console.error('Add comment error', err)
    res.status(500).json({ success: false, message: 'Failed to add comment' })
  }
})

// Delete comment
router.delete('/:id/comments/:commentId', [ authenticate, param('id').isMongoId(), param('commentId').isMongoId() ], async (req, res) => {
  try {
    const post = await LookbookPost.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')
    if (!isAdmin && String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' })
    }
    comment.remove()
    await post.save()
    res.json({ success: true, message: 'Comment deleted', data: { comments: post.comments } })
  } catch (err) {
    console.error('Delete comment error', err)
    res.status(500).json({ success: false, message: 'Failed to delete comment' })
  }
})

module.exports = router
