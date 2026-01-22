import { Link } from 'react-router-dom'
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useContent } from '../context/ContentContext.jsx'
import { useEffect, useMemo, useState } from 'react'
import WarningDialog from '../components/WarningDialog.jsx'
import apiService from '../services/api'
import { formatINR } from '../utils/formatCurrency.js'

export default function ProductsRow() {
  const { ids: wishlistIds, toggle } = useWishlist()
  const { content } = useContent()
  const [newArrivalsRemote, setNewArrivalsRemote] = useState([])
  const [sectionPreviewById, setSectionPreviewById] = useState({})
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
    async function load() {
      try {
        // Use newest for New Arrivals
        const [newestRes] = await Promise.all([
          apiService.getProducts({ sort: 'newest', limit: 4 })
        ])
        const newest = newestRes?.data?.products || []
        if (!ignore) {
          setNewArrivalsRemote(Array.isArray(newest) ? newest : [])
        }
      } catch {
        // Silently fail - will show empty sections
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    let ignore = false
    const locked = ['best-sellers', 'recommended', 'most-viewed']
    const sections = Array.isArray(content?.homepage?.productSections) ? content.homepage.productSections : []
    const active = sections
      .filter(s => locked.includes(String(s?.id || '')))
      .filter(s => s?.enabled !== false)
      .map(s => ({
        id: String(s.id),
        title: String(s.title || s.id),
        productIds: Array.isArray(s.productIds) ? s.productIds.map(String).filter(Boolean) : []
      }))

    async function loadPreviews() {
      try {
        const results = await Promise.all(active.map(async (sec) => {
          const ids = sec.productIds.slice(0, 4)
          if (ids.length === 0) return [sec.id, []]
          const res = await apiService.getProductsByIds(ids)
          const prods = res?.data?.products || []
          return [sec.id, Array.isArray(prods) ? prods : []]
        }))
        if (ignore) return
        const next = {}
        for (const [id, prods] of results) next[id] = prods
        setSectionPreviewById(next)
      } catch {
        if (!ignore) setSectionPreviewById({})
      }
    }

    loadPreviews()
    return () => { ignore = true }
  }, [content])
  
  // Only use API data, no fallbacks to hardcoded products
  const newArrivals = useMemo(() => {
    return Array.isArray(newArrivalsRemote) ? newArrivalsRemote.slice(0, 4) : []
  }, [newArrivalsRemote])

  const getPrimaryMedia = (p) => {
    // First check colorImages (new structure)
    if (p.colorImages && typeof p.colorImages === 'object') {
      // Get the first color that has images
      const colors = Object.keys(p.colorImages)
      for (const color of colors) {
        const colorMedia = p.colorImages[color]
        if (Array.isArray(colorMedia) && colorMedia.length > 0) {
          const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
          const firstVideo = colorMedia.find(m => m.type === 'video')
          if (firstImage) return { kind: 'image', url: firstImage.url }
          if (firstVideo) return { kind: 'video', url: firstVideo.url }
        }
      }
    }

    // Fallback to old images array
    const media = Array.isArray(p.images) ? p.images : []
    const firstImage = media.find(m => !m.type || m.type === 'image')
    const firstVideo = media.find(m => m.type === 'video')
    const fallbackUrl = p.image || media[0]?.url
    return firstImage ? { kind: 'image', url: firstImage.url }
      : firstVideo ? { kind: 'video', url: firstVideo.url }
      : { kind: 'image', url: fallbackUrl }
  }
  
  const ProductSection = ({ title, products: sectionProducts, viewMoreTo }) => (
    <div className="mb-6">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 py-3 mb-3">
        <h2 className="text-base md:text-lg font-semibold text-center text-gray-900 max-w-7xl mx-auto px-4">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
        {sectionProducts.map((p) => {
          const pid = p.id || p._id
          const pidStr = String(pid)
          const media = getPrimaryMedia(p)
          const wished = wishlistIds.includes(pidStr)
          return (
            <div
              key={pid}
              className="group relative"
            >
              <Link to={`/product/${pid}`} className="block aspect-[4/5] w-full bg-gray-100 overflow-hidden">
                {media.kind === 'video' ? (
                  <video src={media.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img
                    src={media.url}
                    alt={p.name}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                )}
              </Link>

              {/* Name, price and wishlist button below the product */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex-1 pl-2">
                  <Link to={`/product/${pid}`} className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug hover:underline">{p.name}</Link>
                  <div className="mt-1 text-xs text-gray-700">{formatINR(p.price)}</div>
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
      {viewMoreTo && (
        <div className="mt-4 text-center">
          <Link
            to={viewMoreTo}
            className="inline-block px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            View More
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <section className="w-full pt-0 pb-0">
      <ProductSection title="New Arrivals" products={newArrivals} viewMoreTo="/search?collection=new-arrivals" />

      {(Array.isArray(content?.homepage?.productSections) ? content.homepage.productSections : [])
        .filter(s => ['best-sellers', 'recommended', 'most-viewed'].includes(String(s?.id || '')))
        .filter(s => s?.enabled !== false)
        .map(s => {
          const id = String(s.id)
          const title = String(s.title || s.id)
          const ids = Array.isArray(s.productIds) ? s.productIds.map(String).filter(Boolean) : []
          const products = Array.isArray(sectionPreviewById[id]) ? sectionPreviewById[id] : []
          if (ids.length === 0) return null
          return (
            <ProductSection
              key={id}
              title={title}
              products={products}
              viewMoreTo={`/search?section=${encodeURIComponent(id)}`}
            />
          )
        })}

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
    </section>
  )
}
