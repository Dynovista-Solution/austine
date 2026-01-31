import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import apiService from '../services/api'
import { PlusIcon, TrashIcon, XMarkIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline'

export default function AdminProductForm({ mode = 'create' }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = mode === 'edit' || Boolean(id)
  const { products, addProduct, updateProduct } = useAdmin()

  const existing = useMemo(() => {
    if (!isEdit) return null
    const pid = id
    return products.find(p => String(p.id) === String(pid) || String(p._id) === String(pid)) || null
  }, [isEdit, id, products])

  // Form state
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    subcategory: '',
    price: '', // discounted/current price
    originalPrice: '', // original (before discount)
    showOriginalPrice: true,
    sizes: [], // Simple array of sizes like ['S', 'M', 'L']
    colors: [], // Simple array of colors like ['Red', 'Blue', 'Black']
    colorImages: {}, // { "Red": [{url}], "Blue": [{url}] }
    sizeChartImage: '', // URL to size chart image
    inventory: [], // Array of { color, size, quantity }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newSubOpen, setNewSubOpen] = useState(false)
  const [newSubcategory, setNewSubcategory] = useState('')

  // Load categories list
  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await apiService.getCategories()
        const arr = res?.data?.categories || []
        if (!ignore) setCategories(arr)
      } catch {
        // ignore; categories can be empty
      }
    }
    load();
    return () => { ignore = true }
  }, [])

  const currentCategory = useMemo(() => categories.find(c => c.name === form.category) || null, [categories, form.category])
  // Fallback: derive subcategories from existing products if API doesn't provide them
  const fallbackSubs = useMemo(() => {
    if (!form.category) return []
    const subs = (products || [])
      .filter(p => String(p.category || '').trim() === String(form.category || '').trim())
      .map(p => String(p.subcategory || '').trim())
      .filter(Boolean)
    return Array.from(new Set(subs))
  }, [products, form.category])
  const mergedSubs = useMemo(() => {
    const apiSubs = Array.isArray(currentCategory?.subcategories) ? currentCategory.subcategories : []
    return Array.from(new Set([ ...apiSubs.map(s => String(s||'').trim()).filter(Boolean), ...fallbackSubs ]))
  }, [currentCategory, fallbackSubs])

  useEffect(() => {
    if (existing) {
      setForm(prev => ({
        ...prev,
        name: existing.name || '',
        sku: existing.sku || '',
        description: existing.description || '',
        category: existing.category || '',
        subcategory: existing.subcategory || '',
        price: existing.price || '',
        originalPrice: existing.originalPrice || '',
        showOriginalPrice: existing.showOriginalPrice !== false,
        sizes: Array.isArray(existing.sizes) ? existing.sizes : [],
        colors: Array.isArray(existing.colors) ? existing.colors : [],
        colorImages: existing.colorImages || {},
        sizeChartImage: existing.sizeChartImage || '',
        inventory: Array.isArray(existing.inventory) ? existing.inventory : [],
      }))
    }
  }, [existing])

  const onChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  // Size and Color management
  const addSize = (size) => {
    if (!size || form.sizes.includes(size)) return
    onChange('sizes', [...form.sizes, size])
  }

  const removeSize = (size) => {
    onChange('sizes', form.sizes.filter(s => s !== size))
    // Also remove inventory items for this size
    const updatedInventory = form.inventory.filter(item => item.size !== size)
    onChange('inventory', updatedInventory)
  }

  const addColor = (color) => {
    if (!color || form.colors.includes(color)) return
    onChange('colors', [...form.colors, color])
  }

  const removeColor = (color) => {
    onChange('colors', form.colors.filter(c => c !== color))
    // Also remove color images and inventory when color is removed
    const updatedColorImages = { ...form.colorImages }
    delete updatedColorImages[color]
    onChange('colorImages', updatedColorImages)
    
    const updatedInventory = form.inventory.filter(item => item.color !== color)
    onChange('inventory', updatedInventory)
  }

  // Color-specific image management
  const addImagesToColor = async (color, files) => {
    try {
      const currentImages = form.colorImages?.[color] || []
      const imageCount = currentImages.filter(img => img.type !== 'video').length
      
      // Limit to 5 photos per color
      const allowedFiles = files.slice(0, Math.max(0, 5 - imageCount))
      
      if (allowedFiles.length === 0) {
        alert(`Maximum 5 photos allowed per color. ${color} already has ${imageCount} photos.`)
        return
      }
      
      const result = await apiService.uploadImages(allowedFiles)
      const urls = (result?.data?.files || []).map(f => ({ url: f.url || f, type: 'image' }))

      const updatedColorImages = { ...form.colorImages }
      if (!updatedColorImages[color]) {
        updatedColorImages[color] = []
      }
      updatedColorImages[color] = [...(updatedColorImages[color] || []), ...urls]
      onChange('colorImages', updatedColorImages)
    } catch (e) {
      console.error('Image upload failed:', e)
      alert('Image upload failed: ' + e?.message)
    }
  }

  const addVideoToColor = async (color, file) => {
    try {
      const currentImages = form.colorImages?.[color] || []
      const hasVideo = currentImages.some(img => img.type === 'video')
      
      if (hasVideo) {
        alert(`${color} already has a video. Remove the existing video first.`)
        return
      }
      
      const result = await apiService.uploadVideo(file)
      const videoUrl = result?.data?.url || result?.data || ''

      const updatedColorImages = { ...form.colorImages }
      if (!updatedColorImages[color]) {
        updatedColorImages[color] = []
      }
      updatedColorImages[color] = [...(updatedColorImages[color] || []), { url: videoUrl, type: 'video' }]
      onChange('colorImages', updatedColorImages)
    } catch (e) {
      console.error('Video upload failed:', e)
      alert('Video upload failed: ' + e?.message)
    }
  }

  const removeImageFromColor = (color, imageIndex) => {
    const updatedColorImages = { ...form.colorImages }
    if (updatedColorImages[color]) {
      updatedColorImages[color] = updatedColorImages[color].filter((_, i) => i !== imageIndex)
      onChange('colorImages', updatedColorImages)
    }
  }

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Normalize pricing: discounted is optional; if missing but original provided, use original as price
      const nOriginal = Number(form.originalPrice)
      const nDiscounted = Number(form.price)
      const hasOriginal = !Number.isNaN(nOriginal) && nOriginal > 0
      const hasDiscounted = !Number.isNaN(nDiscounted) && nDiscounted > 0

      let effectivePrice = hasDiscounted ? nDiscounted : (hasOriginal ? nOriginal : NaN)
      let effectiveOriginal = hasDiscounted && hasOriginal ? nOriginal : undefined

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        subcategory: form.subcategory.trim(),
        price: effectivePrice,
        originalPrice: effectiveOriginal,
        showOriginalPrice: effectiveOriginal !== undefined ? Boolean(form.showOriginalPrice) : false,
        sizes: Array.isArray(form.sizes) ? form.sizes : [],
        colors: Array.isArray(form.colors) ? form.colors : [],
        colorImages: form.colorImages || {},
        sizeChartImage: form.sizeChartImage || '',
        inventory: Array.isArray(form.inventory) ? form.inventory : [],
      }

      console.log('Submitting product:', payload)

      // Validate required fields precisely
      const missing = []
      if (!payload.name) missing.push('name')
      if (!(typeof payload.price === 'number' && !Number.isNaN(payload.price) && payload.price > 0)) missing.push('price')
      if (!payload.category) missing.push('category')
      if (missing.length) {
        throw new Error(`Please fill required fields: ${missing.join(', ')}`)
      }

      // Create or update
      if (isEdit && existing) {
        console.log('Updating existing product')
        const updated = await updateProduct(existing.id || existing._id, payload)
        navigate('/admin/products')
        return updated
      } else {
        console.log('Creating new product')
        const created = await addProduct(payload)
        console.log('Product created:', created)
        navigate('/admin/products')
        return created
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError(err?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        <button onClick={() => navigate('/admin/products')} className="text-sm text-gray-600 hover:text-gray-900">Back to products</button>
      </div>

      {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
              <input value={form.name} onChange={(e) => onChange('name', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Classic Leather Boots" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input value={form.sku} onChange={(e) => onChange('sku', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. CLB-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <div className="flex items-center gap-2">
                <select value={form.category} onChange={(e) => { onChange('category', e.target.value); onChange('subcategory','') }} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select a category</option>
                  {categories.map(c => (<option key={c._id || c.name} value={c.name}>{c.name}</option>))}
                </select>
                <button type="button" onClick={() => setNewCatOpen(v=>!v)} className="text-xs px-2 py-2 border rounded whitespace-nowrap">{newCatOpen ? 'Cancel' : 'New'}</button>
              </div>
              {newCatOpen && (
                <div className="mt-2 flex items-center gap-2">
                  <input value={newCategory} onChange={(e)=>setNewCategory(e.target.value)} placeholder="New category name" className="flex-1 border rounded px-3 py-2 text-sm" />
                  <button type="button" className="text-xs px-3 py-2 border rounded" onClick={async()=>{
                    const name = newCategory.trim(); if(!name) return;
                    try { const res = await apiService.createCategory(name); const cat = res?.data?.category; if(cat){ setCategories(prev=>[...prev, cat]); onChange('category', cat.name); onChange('subcategory',''); setNewCategory(''); setNewCatOpen(false);} } catch(e){ alert(e?.message||'Failed to create category'); }
                  }}>Add</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <div className="flex items-center gap-2">
                <select value={form.subcategory} disabled={!form.category} onChange={(e)=>onChange('subcategory', e.target.value)} className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50">
                  <option value="">{form.category ? 'Select a subcategory' : 'Select a category first'}</option>
                  {mergedSubs.map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
                <button type="button" onClick={() => setNewSubOpen(v=>!v)} disabled={!form.category} className="text-xs px-2 py-2 border rounded whitespace-nowrap disabled:opacity-50">{newSubOpen ? 'Cancel' : 'New'}</button>
              </div>
              {newSubOpen && (
                <div className="mt-2 flex items-center gap-2">
                  <input value={newSubcategory} onChange={(e)=>setNewSubcategory(e.target.value)} placeholder="New subcategory name" className="flex-1 border rounded px-3 py-2 text-sm" />
                  <button type="button" className="text-xs px-3 py-2 border rounded" onClick={async()=>{
                    const sub = newSubcategory.trim(); if(!sub || !form.category) return;
                    try { const res = await apiService.addSubcategory(form.category, sub); const cat = res?.data?.category; if(cat){ setCategories(prev=> prev.map(c=> c.name===cat.name? cat : c)); onChange('subcategory', sub); setNewSubcategory(''); setNewSubOpen(false);} } catch(e){ alert(e?.message||'Failed to add subcategory'); }
                  }}>Add</button>
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={form.description} onChange={(e) => onChange('description', e.target.value)} rows={4} className="w-full border rounded px-3 py-2 text-sm" placeholder="Describe the product..." />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original price</label>
              <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => onChange('originalPrice', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. 120" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted price *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => onChange('price', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. 89.99" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="show-original-price"
              type="checkbox"
              checked={Boolean(form.showOriginalPrice)}
              disabled={!form.originalPrice}
              onChange={(e) => onChange('showOriginalPrice', e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="show-original-price" className={`text-sm ${!form.originalPrice ? 'text-gray-400' : 'text-gray-700'}`}>
              Show original price on website (strike-through)
            </label>
          </div>
        </section>

        {/* Sizes */}
        <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Sizes</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(form.sizes || []).map(size => (
                <span key={size} className="inline-flex items-center text-xs bg-gray-100 rounded px-2 py-1 mr-1">
                  {size}
                  <button type="button" className="ml-1 text-gray-500 hover:text-gray-900" onClick={() => removeSize(size)}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="add-size"
                placeholder="Add size e.g. S, M, L"
                className="border rounded px-3 py-2 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSize(e.currentTarget.value.trim())
                    e.currentTarget.value = ''
                  }
                }}
              />
              <button
                type="button"
                className="text-xs px-3 py-2 border rounded"
                onClick={() => {
                  const el = document.getElementById('add-size')
                  if (el && el.value.trim()) {
                    addSize(el.value.trim())
                    el.value = ''
                  }
                }}
              >
                Add Size
              </button>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Colors</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(form.colors || []).map(color => (
                <span key={color} className="inline-flex items-center text-xs bg-gray-100 rounded px-2 py-1 mr-1">
                  {color}
                  <button type="button" className="ml-1 text-gray-500 hover:text-gray-900" onClick={() => removeColor(color)}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="add-color"
                placeholder="Add color e.g. Red, Blue, Black"
                className="border rounded px-3 py-2 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addColor(e.currentTarget.value.trim())
                    e.currentTarget.value = ''
                  }
                }}
              />
              <button
                type="button"
                className="text-xs px-3 py-2 border rounded"
                onClick={() => {
                  const el = document.getElementById('add-color')
                  if (el && el.value.trim()) {
                    addColor(el.value.trim())
                    el.value = ''
                  }
                }}
              >
                Add Color
              </button>
            </div>
          </div>
        </section>

        {/* Inventory Management */}
        {form.colors.length > 0 && form.sizes.length > 0 && (
          <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Inventory by Color & Size</h2>
            <p className="text-xs text-gray-600 mb-4">Set stock quantities for each color-size combination</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.colors.map(color =>
                    form.sizes.map(size => {
                      const existingItem = form.inventory.find(item => item.color === color && item.size === size)
                      const quantity = existingItem ? existingItem.quantity : 0
                      return (
                        <tr key={`${color}-${size}`}>
                          <td className="px-3 py-2 text-sm text-gray-900">{color}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{size}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 0
                                const newInventory = [...form.inventory]
                                const existingIndex = newInventory.findIndex(item => item.color === color && item.size === size)
                                
                                if (existingIndex >= 0) {
                                  if (newQuantity > 0) {
                                    newInventory[existingIndex].quantity = newQuantity
                                  } else {
                                    newInventory.splice(existingIndex, 1)
                                  }
                                } else if (newQuantity > 0) {
                                  newInventory.push({ color, size, quantity: newQuantity })
                                }
                                
                                onChange('inventory', newInventory)
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Total stock will be automatically calculated from all inventory quantities.
            </div>
          </section>
        )}

        {/* Size Chart Image */}
        <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Size Chart</h2>
          <p className="text-xs text-gray-600 mb-4">Upload a size chart image that will be displayed when customers click the "Size Chart" button on the product page</p>
          
          {form.sizeChartImage ? (
            <div className="space-y-3">
              <div className="relative inline-block border border-gray-200 rounded overflow-hidden">
                <img src={form.sizeChartImage} alt="Size Chart" className="max-w-full h-auto max-h-64 object-contain" />
                <button
                  type="button"
                  onClick={() => onChange('sizeChartImage', '')}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded p-1.5 hover:bg-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="size-chart-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      console.log('Starting upload for:', file.name, file.type, file.size)
                      const result = await apiService.uploadImages([file])
                      console.log('Full upload result:', result)
                      
                      const url = result?.data?.files?.[0]?.url || result?.data?.files?.[0]
                      console.log('Extracted URL:', url)
                      
                      if (url) {
                        onChange('sizeChartImage', url)
                        alert('Size chart uploaded successfully!')
                      } else {
                        console.error('No URL found. Result structure:', JSON.stringify(result, null, 2))
                        alert('Upload failed: No URL returned from server')
                      }
                    } catch (e) {
                      console.error('Size chart upload failed - Full error:', e)
                      console.error('Error message:', e?.message)
                      console.error('Error stack:', e?.stack)
                      alert('Size chart upload failed: ' + (e?.message || 'Unknown error - check console'))
                    }
                  }
                  e.target.value = ''
                }}
              />
              <label
                htmlFor="size-chart-upload"
                className="inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                Upload Size Chart
              </label>
            </div>
          )}
        </section>

        {/* Color Images */}
        {form.colors.length > 0 && (
          <section className="bg-white rounded border border-gray-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Color Images</h2>
            <p className="text-xs text-gray-600 mb-4">Upload specific images for each color variant</p>
            <div className="space-y-6">
              {form.colors.map(color => (
                <div key={color} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{color} Images</h3>

                  {/* Current images for this color */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                    {(form.colorImages?.[color] || []).map((image, index) => (
                      <div key={index} className="relative bg-gray-100 border rounded overflow-hidden">
                        {image.type === 'video' ? (
                          <video src={image.url} className="w-full h-24 object-cover" />
                        ) : (
                          <img src={image.url} alt={`${color} ${index + 1}`} className="w-full h-24 object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageFromColor(color, index)}
                          className="absolute top-1 right-1 bg-white/80 rounded p-1 border"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                          {image.type === 'video' ? 'VIDEO' : 'PHOTO'}
                        </div>
                      </div>
                    ))}

                    {/* Upload buttons */}
                    {(form.colorImages?.[color] || []).filter(img => img.type !== 'video').length < 5 && (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id={`color-image-${color}`}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length > 0) {
                              addImagesToColor(color, files)
                            }
                            e.target.value = ''
                          }}
                        />
                        <label
                          htmlFor={`color-image-${color}`}
                          className="flex items-center justify-center h-24 border-2 border-dashed rounded text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="text-center">
                            <PhotoIcon className="w-6 h-6 mx-auto mb-1" />
                            <div>Add Photo</div>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Video upload button - only if no video exists */}
                    {!(form.colorImages?.[color] || []).some(img => img.type === 'video') && (
                      <div className="relative">
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          id={`color-video-${color}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              addVideoToColor(color, file)
                            }
                            e.target.value = ''
                          }}
                        />
                        <label
                          htmlFor={`color-video-${color}`}
                          className="flex items-center justify-center h-24 border-2 border-dashed rounded text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="text-center">
                            <VideoCameraIcon className="w-6 h-6 mx-auto mb-1" />
                            <div>Add Video</div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Photos: {(form.colorImages?.[color] || []).filter(img => img.type !== 'video').length}/5
                    </span>
                    <span>
                      Video: {(form.colorImages?.[color] || []).some(img => img.type === 'video') ? '1/1' : '0/1'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/products')} className="px-4 py-2 border rounded text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50 hover:bg-blue-700 hover:shadow-md transition-all duration-200 disabled:hover:bg-blue-600 disabled:hover:shadow-none">{saving ? 'Saving...' : (isEdit ? 'Update product' : 'Add product')}</button>
        </div>
      </form>
    </div>
  )
}
