import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiService from '../services/api'

export default function AdminLookbookPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function load() {
    try {
      setLoading(true)
      const res = await apiService.getLookbookPosts({ page: 1, limit: 50 })
      setPosts(res?.data?.posts || [])
    } catch (e) {
      setError(e.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this post?')) return
    try {
      await apiService.deleteLookbookPost(id)
      await load()
    } catch (e) {
      alert(e.message || 'Failed to delete')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Lookbook</h1>
        <Link to="/admin/lookbook/new" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">New Post</Link>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-hidden bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reactions</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {p.coverImage ? <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-500">{new Date(p.createdAt || Date.now()).toLocaleString()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">👍 {p.likeCount} • 👎 {p.dislikeCount}</td>
                <td className="px-4 py-2 text-sm text-gray-700">💬 {p.commentCount}</td>
                <td className="px-4 py-2 text-right text-sm">
                  <button onClick={() => navigate(`/admin/lookbook/${p.id}/view`)} className="px-2 py-1 text-green-600 hover:text-green-800">View</button>
                  <button onClick={() => navigate(`/admin/lookbook/${p.id}/edit`)} className="ml-2 px-2 py-1 text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="ml-2 px-2 py-1 text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && !loading && (
              <tr><td className="px-4 py-6 text-sm text-gray-500">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
