const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
}, { timestamps: true })

const lookbookPostSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  slug: { type: String, unique: true, sparse: true },
  content: { type: String, required: true },
  images: [{ url: String, type: { type: String, enum: ['image', 'video'], default: 'image' } }],
  coverImage: { type: String },
  tags: { type: [String], default: [] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true })

lookbookPostSchema.pre('save', function(next) {
  if (!this.slug) {
    const base = this.title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 100)
    this.slug = base + '-' + Math.random().toString(36).slice(2, 8)
  }
  if (!this.coverImage && Array.isArray(this.images) && this.images.length) {
    this.coverImage = this.images[0].url
  }
  next()
})

lookbookPostSchema.methods.toPublicJSON = function(currentUserId) {
  const userIdStr = currentUserId ? String(currentUserId) : null
  return {
    id: this._id,
    title: this.title,
    slug: this.slug,
    content: this.content,
    coverImage: this.coverImage,
    images: this.images,
    tags: this.tags,
    author: this.author,
    likeCount: this.likes.length,
    dislikeCount: this.dislikes.length,
    commentCount: this.comments.length,
    userReaction: userIdStr ? (this.likes.some(u => String(u) === userIdStr) ? 'like' : this.dislikes.some(u => String(u) === userIdStr) ? 'dislike' : null) : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

module.exports = mongoose.model('LookbookPost', lookbookPostSchema)
