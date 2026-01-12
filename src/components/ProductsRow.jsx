import { Link } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/outline'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useAdmin } from '../admin/AdminContext.jsx'
import { useEffect, useMemo, useState } from 'react'
import apiService from '../services/api'

export default function ProductsRow() {
  const { ids: wishlistIds, toggle } = useWishlist()
  const [newArrivalsRemote, setNewArrivalsRemote] = useState([])
  const [bestSellersRemote, setBestSellersRemote] = useState([])

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        // Use newest for New Arrivals
        const [newestRes, bestRes] = await Promise.all([
          apiService.getProducts({ sort: 'newest', limit: 4 }),
          apiService.getProducts({ sort: 'popular', limit: 4 })
        ])
        const newest = newestRes?.data?.products || []
        const best = bestRes?.data?.products || []
        if (!ignore) {
          setNewArrivalsRemote(Array.isArray(newest) ? newest : [])
          setBestSellersRemote(Array.isArray(best) ? best : [])
        }
      } catch {
        // Silently fail - will show empty sections
      }
    }
    load()
    return () => { ignore = true }
  }, [])
  
  // Only use API data, no fallbacks to hardcoded products
  const newArrivals = useMemo(() => {
    return Array.isArray(newArrivalsRemote) ? newArrivalsRemote.slice(0, 4) : []
  }, [newArrivalsRemote])
  
  const bestSellers = useMemo(() => {
    // Filter out products already in New Arrivals to ensure distinct lists
    const newArrivalIds = new Set(newArrivals.map(p => String(p.id || p._id)))
    const filtered = Array.isArray(bestSellersRemote) ? bestSellersRemote.filter(p => !newArrivalIds.has(String(p.id || p._id))) : []
    return filtered.slice(0, 4)
  }, [bestSellersRemote, newArrivals])

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
  
  const ProductSection = ({ title, products: sectionProducts }) => (
    <div className="mb-6">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 py-3 mb-3">
        <h2 className="text-base md:text-lg font-semibold text-center text-gray-900 max-w-7xl mx-auto px-4">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
        {sectionProducts.map((p) => {
          const pid = p.id || p._id
          const media = getPrimaryMedia(p)
          const wished = wishlistIds.includes(pid)
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
                  <div className="mt-1 text-xs text-gray-700">€ {Number(p.price).toFixed(2)}</div>
                </div>
                <div>
                  <button
                    onClick={() => toggle(pid)}
                    aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={wished}
                    className={`${wished ? 'text-black' : 'text-gray-700'} pr-2 p-1`}
                  >
                    <HeartIcon className={`h-4 w-4 ${wished ? 'fill-black text-black' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 text-center">
        <Link 
          to="/search" 
          className="inline-block px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          View More
        </Link>
      </div>
    </div>
  )

  return (
    <section className="w-full pt-0 pb-0">
      <ProductSection title="New Arrivals" products={newArrivals} />
      <ProductSection title="Best Sellers" products={bestSellers} />
    </section>
  )
}
