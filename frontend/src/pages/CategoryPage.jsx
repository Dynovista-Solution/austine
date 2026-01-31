import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import apiService from '../services/api'
import { useAdmin } from '../admin/AdminContext.jsx'
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useWishlist } from '../context/WishlistContext.jsx'
import WarningDialog from '../components/WarningDialog.jsx'
import { formatINR } from '../utils/formatCurrency.js'

export default function CategoryPage() {
  const { category: encodedCategory } = useParams()
  const category = decodeURIComponent(encodedCategory) // URL-decode the category parameter
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || 1)
  const sort = params.get('sort') || 'newest'
  const limit = 24
  const sub = params.get('sub') || ''

  const { products: fallbackProducts } = useAdmin()
  const { ids: wishlistIds, toggle } = useWishlist()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ products: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [wishlistRemoveDialog, setWishlistRemoveDialog] = useState({ isOpen: false, id: null, name: '' })

  const confirmWishlistRemove = () => {
    if (wishlistRemoveDialog.id) toggle(wishlistRemoveDialog.id)
  }

  const handleWishlistClick = (pid, name) => {
    const idStr = String(pid)
    if (wishlistIds.includes(idStr)) {
      setWishlistRemoveDialog({ isOpen: true, id: idStr, name: name || 'this item' })
      return
    }
    toggle(idStr)
  }

  useEffect(() => {
    let ignore = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const res = await apiService.getProducts({ category, page, limit, sort })
        let products = res?.data?.products || []
        // Optional client-side filter by subcategory when provided
        if (sub) {
          products = products.filter(p => (p.subcategory || '').toLowerCase().includes(sub.toLowerCase()))
        }
        const pagination = res?.data?.pagination || { page: 1, pages: 1, total: products.length }
        if (!ignore) setData({ products, pagination })
      } catch (e) {
        console.warn('Falling back to local products for category:', e?.message)
        let filtered = (fallbackProducts || []).filter(p => (p.category || category)?.toUpperCase() === String(category).toUpperCase())
        if (sub) {
          filtered = filtered.filter(p => (p.subcategory || '').toLowerCase().includes(sub.toLowerCase()))
        }
        if (!ignore) setData({ products: filtered, pagination: { page: 1, pages: 1, total: filtered.length } })
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [category, page, sort, sub])

  const onChangeSort = (e) => {
    try {
      const nextParams = new URLSearchParams(params.toString())
      nextParams.set('sort', e.target.value)
      nextParams.set('page', '1')
      setParams(nextParams)
    } catch (e) {
      console.warn('Failed to update category params', e)
    }
  }

  const onChangePage = (nextPage) => {
    try {
      const nextParams = new URLSearchParams(params.toString())
      nextParams.set('page', String(nextPage))
      setParams(nextParams)
    } catch (e) {
      console.warn('Failed to update category page param', e)
    }
  }

  const prettyCategory = useMemo(() => decodeURIComponent(category).toUpperCase(), [category])

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{prettyCategory}</h1>
          {sub && <div className="text-xs text-gray-600">{sub}</div>}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Sort</label>
          <select value={sort} onChange={onChangeSort} className="text-xs border rounded px-2 py-1">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="mt-6 text-sm text-gray-600">Loading…</div>
      )}
      {error && (
        <div className="mt-6 text-sm text-red-600">{error}</div>
      )}

      {!loading && data.products.length === 0 && (
        <div className="mt-6 text-sm text-gray-700">No products found.</div>
      )}

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.products.map(p => {
          const pid = p.id || p._id
          const pidStr = String(pid)

          // Get primary media (check colorImages first, then fallback to images)
          let img = '/placeholder.jpg'
          let firstVideo = null

          // Check colorImages first (new structure)
          if (p.colorImages && typeof p.colorImages === 'object') {
            const colors = Object.keys(p.colorImages)
            for (const color of colors) {
              const colorMedia = p.colorImages[color]
              if (Array.isArray(colorMedia) && colorMedia.length > 0) {
                const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
                const video = colorMedia.find(m => m.type === 'video')
                if (firstImage) {
                  img = firstImage.url
                  break
                }
                if (video && !firstVideo) {
                  firstVideo = video.url
                }
              }
            }
          }

          // Fallback to old images array if no colorImages found
          if (img === '/placeholder.jpg') {
            const media = Array.isArray(p.images) ? p.images : []
            const firstImage = media.find(m => !m.type || m.type === 'image')
            firstVideo = firstVideo || media.find(m => m.type === 'video')?.url
            img = firstImage?.url || p.image || '/placeholder.jpg'
          }

          const wished = wishlistIds.includes(pidStr)
          return (
            <div key={pid} className="group block">
              <Link to={`/product/${pid}`} className="block">
                <div className="bg-gray-100 aspect-[4/5] overflow-hidden">
                  {firstVideo && !firstImage ? (
                    <video src={firstVideo} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                  )}
                </div>
              </Link>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex-1 pl-2">
                  <Link to={`/product/${pid}`} className="text-xs text-gray-900 font-medium line-clamp-2 hover:underline">{p.name}</Link>
                  {(() => {
                    const currentPrice = Number(p.price || 0)
                    const originalPrice = Number(p.originalPrice || 0)
                    const showOriginal = Number.isFinite(originalPrice) && originalPrice > currentPrice && p.showOriginalPrice !== false
                    return (
                      <div className="flex items-baseline gap-2">
                        {showOriginal && (
                          <span className="text-[11px] text-gray-500 line-through">{formatINR(originalPrice)}</span>
                        )}
                        <span className="text-xs text-gray-700">{formatINR(currentPrice)}</span>
                      </div>
                    )
                  })()}
                </div>
                <div>
                  <button
                    onClick={() => handleWishlistClick(pidStr, p.name)}
                    aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={wished}
                    className={`${wished ? 'text-red-600' : 'text-gray-700'} pr-2 p-1`}
                  >
                    {wished ? (
                      <HeartIconSolid className="h-4 w-4 text-red-600" />
                    ) : (
                      <HeartIconOutline className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <WarningDialog
        isOpen={wishlistRemoveDialog.isOpen}
        onClose={() => setWishlistRemoveDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmWishlistRemove}
        title="Remove from Wishlist"
        message={`Remove "${wishlistRemoveDialog.name}" from your wishlist?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />

      {data.pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onChangePage(page - 1)}
          >
            Prev
          </button>
          <span className="text-xs text-gray-700">Page {page} of {data.pagination.pages}</span>
          <button
            className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            disabled={page >= data.pagination.pages}
            onClick={() => onChangePage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}
