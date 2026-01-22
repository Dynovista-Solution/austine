import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiService from '../services/api'

export default function AdminLookbookForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '', images: [], tags: '', isPublished: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!isEdit) return
      try {
        const res = await apiService.getLookbookPost(id)
        const p = res?.data?.post
        if (!ignore && p) {
          setForm({ title: p.title || '', content: p.content || '', images: p.images || [], tags: (p.tags || []).join(', '), isPublished: true })
        }
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load post')
      }
    }
    load()
    return () => { ignore = true }
  }, [id, isEdit])

  function updateField(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        images: form.images,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        isPublished: form.isPublished,
      }
      if (isEdit) {
        await apiService.updateLookbookPost(id, payload)
      } else {
        await apiService.createLookbookPost(payload)
      }
      navigate('/admin/lookbook')
    } catch (e) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function removeImage(idx) {
    const arr = [...form.images]
    arr.splice(idx, 1)
    updateField('images', arr)
  }

  // Upload handlers (images)
  async function handleUploadImages(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    try {
      setSaving(true)
      const result = await apiService.uploadImages(files)
      const filesInfo = result?.data?.files || []
      const newImgs = filesInfo.map(f => ({ url: f.url || f, type: 'image' }))
      updateField('images', [...form.images, ...newImgs])
    } catch (e) {
      setError(e.message || 'Image upload failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{isEdit ? 'Edit Post' : 'New Post'}</h1>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input value={form.title} onChange={e => updateField('title', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea value={form.content} onChange={e => updateField('content', e.target.value)} rows={8} className="mt-1 block w-full border rounded px-3 py-2 text-sm" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <label className="inline-flex items-center px-3 py-2 border rounded text-sm cursor-pointer bg-white hover:bg-gray-50">
              <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleUploadImages(e.target.files)} />
              Upload images
            </label>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {form.images.map((img, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="bg-gray-100 overflow-hidden mb-2">
                  {img.url ? <img src={img.url} alt="" className="w-full h-24 object-cover" /> : <div className="w-full h-24 flex items-center justify-center text-xs text-gray-500">No image</div>}
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => removeImage(idx)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                </div>
              </div>
            ))}
            {form.images.length === 0 && <div className="text-xs text-gray-500">No images yet. Upload one.</div>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
          <input value={form.tags} onChange={e => updateField('tags', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input id="isPublished" type="checkbox" checked={form.isPublished} onChange={e => updateField('isPublished', e.target.checked)} />
          <label htmlFor="isPublished" className="text-sm text-gray-700">Published</label>
        </div>
        <div>
          <button disabled={saving} className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
