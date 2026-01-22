import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import Lightbox from '../components/Lightbox'

export default function AdminLookbookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    loadPost()
  }, [id])

  async function loadPost() {
    try {
      setLoading(true)
      const res = await apiService.getLookbookPost(id)
      const p = res?.data?.post
      const c = res?.data?.comments || []
      setPost(p)
      setComments(c)
    } catch (e) {
      setError(e.message || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  async function handleReply(commentId, content) {
    if (!content.trim()) return
    try {
      setSubmittingReply(true)
      // For admin replies, we'll add them as regular comments but mark them as admin replies
      await apiService.addLookbookComment(id, `Admin Reply: ${content.trim()}`)
      await loadPost() // Reload to get updated comments
      setReplyText('')
      setReplyingTo(null)
    } catch (e) {
      setError(e.message || 'Failed to add reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('Delete this comment?')) return
    try {
      await apiService.deleteLookbookComment(id, commentId)
      await loadPost() // Reload to get updated comments
    } catch (e) {
      setError(e.message || 'Failed to delete comment')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!post) return <div className="p-6">Post not found</div>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Post Details</h1>
        <button
          onClick={() => navigate('/admin/lookbook')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          ← Back to List
        </button>
      </div>

      {/* Post Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">{post.title}</h2>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Images ({post.images.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {post.images.map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 overflow-hidden rounded border">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(index)
                      setLightboxOpen(true)
                    }}
                    className="w-full h-full"
                    aria-label={`Open image ${index + 1}`}
                  >
                    <img src={image.url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {lightboxOpen && post.images && post.images.length > 0 && (
          <Lightbox
            images={post.images}
            index={lightboxIndex}
            onChangeIndex={setLightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Content</h3>
          <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">{post.content}</div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">{post.likeCount}</div>
            <div className="text-xs text-green-700">Likes</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-2xl font-bold text-red-600">{post.dislikeCount}</div>
            <div className="text-xs text-red-700">Dislikes</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{post.commentCount}</div>
            <div className="text-xs text-blue-700">Comments</div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Comments ({comments.length})</h3>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">User</span> • {new Date(comment.createdAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-line">{comment.content}</p>

                {/* Reply Form */}
                {replyingTo === comment._id ? (
                  <div className="mt-3 pt-3 border-t">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your admin reply..."
                      className="w-full p-2 border rounded text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReply(comment._id, replyText)}
                        disabled={submittingReply || !replyText.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submittingReply ? 'Replying...' : 'Reply'}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                        className="px-3 py-1 text-gray-600 text-xs hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(comment._id)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Reply as Admin
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}