import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiService from '../services/api'

export default function LookbookPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await apiService.getLookbookPosts({ page: 1, limit: 20 })
        const list = res?.data?.posts || []
        if (!ignore) setPosts(list)
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load lookbook')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  if (loading) return <div className="max-w-5xl mx-auto p-4">Loading...</div>
  if (error) return <div className="max-w-5xl mx-auto p-4 text-red-600">{error}</div>

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Lookbook</h1>
      {posts.length === 0 && <div className="text-sm text-gray-600">No posts yet.</div>}
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map(p => (
          <Link key={p.id} to={`/lookbook/${p.id}`} className="group block border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-video w-full bg-gray-100 overflow-hidden">
              {p.coverImage || (p.images && p.images.length > 0 && p.images[0].url) ? (
                <img src={p.coverImage || (p.images && p.images.length > 0 && p.images[0].url)} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No image</div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-sm font-medium line-clamp-2 mb-2 text-gray-900 group-hover:underline">{p.title}</h2>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>👍 {p.likeCount}</span>
                <span>👎 {p.dislikeCount}</span>
                <span>💬 {p.commentCount}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
