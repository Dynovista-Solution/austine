import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import apiService from '../services/api'
import Lightbox from '../components/Lightbox'

export default function LookbookDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [reactionLoading, setReactionLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const load = useCallback(async () => {
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
  }, [id])

  useEffect(() => { load() }, [load])

  const react = async (type) => {
    if (reactionLoading) return
    try {
      setReactionLoading(true)
      const res = await apiService.reactLookbookPost(id, type)
      const updated = res?.data?.post
      if (updated) setPost(updated)
    } catch (e) {
      setError(e.message || 'Reaction failed')
    } finally {
      setReactionLoading(false)
    }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      setCommentLoading(true)
      const res = await apiService.addLookbookComment(id, commentText.trim())
      const c = res?.data?.comments || []
      setComments(c)
      setCommentText('')
    } catch (e) {
      setError(e.message || 'Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto p-4">Loading...</div>
  if (error) return <div className="max-w-3xl mx-auto p-4 text-red-600">{error}</div>
  if (!post) return <div className="max-w-3xl mx-auto p-4">Not found</div>

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">{post.title}</h1>
      
      {/* Image Gallery */}
      {post.images && post.images.length > 0 && (
        <div className="mb-6">
          {post.images.length === 1 ? (
            <div className="aspect-video bg-gray-100 overflow-hidden rounded">
              <button
                type="button"
                onClick={() => {
                  setLightboxIndex(0)
                  setLightboxOpen(true)
                }}
                className="w-full h-full"
                aria-label="Open image"
              >
                <img src={post.images[0].url} alt={post.title} className="w-full h-full object-cover" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.images.map((image, index) => (
                <div key={index} className="aspect-video bg-gray-100 overflow-hidden rounded">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(index)
                      setLightboxOpen(true)
                    }}
                    className="w-full h-full"
                    aria-label={`Open image ${index + 1}`}
                  >
                    <img src={image.url} alt={`${post.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
      
      <article className="prose prose-sm max-w-none mb-8">
        <div style={{ whiteSpace: 'pre-line' }}>{post.content}</div>
      </article>
      <div className="flex items-center gap-4 mb-8 text-sm">
        <button disabled={reactionLoading} onClick={() => react('like')} className={`px-3 py-1 rounded-full border text-xs ${post.userReaction==='like' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>👍 {post.likeCount}</button>
        <button disabled={reactionLoading} onClick={() => react('dislike')} className={`px-3 py-1 rounded-full border text-xs ${post.userReaction==='dislike' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>👎 {post.dislikeCount}</button>
        <span className="text-gray-600">💬 {post.commentCount}</span>
      </div>
      <section>
        <h2 className="text-lg font-medium mb-4">Comments</h2>
        <form onSubmit={submitComment} className="mb-6 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment"
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
          />
            <button disabled={commentLoading} className="px-4 py-2 text-sm rounded bg-black text-white hover:bg-gray-800">
              {commentLoading ? 'Posting...' : 'Post'}
            </button>
        </form>
        <ul className="space-y-4">
          {comments.map(c => (
            <li key={c._id} className="border rounded p-3 text-sm bg-white">
              <div className="text-gray-900 mb-1 whitespace-pre-line">{c.content}</div>
              <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
            </li>
          ))}
          {comments.length === 0 && <li className="text-xs text-gray-500">No comments yet.</li>}
        </ul>
      </section>
    </div>
  )
}
