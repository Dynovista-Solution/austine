import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { HeartIcon as HeartIconOutline, ChevronRightIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAdmin } from '../admin/AdminContext.jsx'
import { useContent } from '../context/ContentContext.jsx'
import WarningDialog from '../components/WarningDialog.jsx'
import Lightbox from '../components/Lightbox'
import { formatINR } from '../utils/formatCurrency.js'
import apiService from '../services/api'

export default function ProductDetail() {
  const { id } = useParams()
  const { getProductById } = useAdmin()
  const { content } = useContent()
  const [product, setProduct] = useState(null)
  const navigate = useNavigate()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[1]?.key || product?.variants?.[0]?.key)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [optionSelections, setOptionSelections] = useState({}) // for group-style variants { [name]: value }
  const { addItem, clear } = useCart()
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist()
  const currentProductId = String(product?.id || product?._id || '')
  const wished = currentProductId ? wishlistIds.includes(currentProductId) : false
  const [wishlistRemoveDialog, setWishlistRemoveDialog] = useState({ isOpen: false, id: null, name: '' })

  const confirmWishlistRemove = () => {
    if (wishlistRemoveDialog.id) toggleWishlist(wishlistRemoveDialog.id)
  }

  const handleWishlistClick = (pid, name) => {
    const idStr = String(pid)
    if (wishlistIds.includes(idStr)) {
      setWishlistRemoveDialog({ isOpen: true, id: idStr, name: name || 'this item' })
      return
    }
    toggleWishlist(idStr)
  }

  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [mostViewedProducts, setMostViewedProducts] = useState([])

  useEffect(() => {
    let ignore = false
    const sections = Array.isArray(content?.homepage?.productSections) ? content.homepage.productSections : []
    const recommended = sections.find(s => String(s?.id || '') === 'recommended')
    const mostViewed = sections.find(s => String(s?.id || '') === 'most-viewed')

    async function loadSections() {
      try {
        const currentId = String(product?.id || product?._id || '')

        const recIds = (Array.isArray(recommended?.productIds) ? recommended.productIds : [])
          .map(String)
          .filter(Boolean)
          .filter(pid => pid !== currentId)
          .slice(0, 4)

        const mvIds = (Array.isArray(mostViewed?.productIds) ? mostViewed.productIds : [])
          .map(String)
          .filter(Boolean)
          .filter(pid => pid !== currentId)
          .slice(0, 4)

        const [recRes, mvRes] = await Promise.all([
          recIds.length ? apiService.getProductsByIds(recIds) : Promise.resolve({ data: { products: [] } }),
          mvIds.length ? apiService.getProductsByIds(mvIds) : Promise.resolve({ data: { products: [] } })
        ])

        const rec = recRes?.data?.products || []
        const mv = mvRes?.data?.products || []
        if (!ignore) {
          setRecommendedProducts(Array.isArray(rec) ? rec : [])
          setMostViewedProducts(Array.isArray(mv) ? mv : [])
        }
      } catch {
        if (!ignore) {
          setRecommendedProducts([])
          setMostViewedProducts([])
        }
      }
    }

    loadSections()
    return () => { ignore = true }
  }, [content, product])

  useEffect(() => {
    let ignore = false
    // Reset product when id changes
    setProduct(null)
    
    async function load() {
      try {
        const res = await apiService.getProduct(id)
        const p = res?.data?.product || res?.data
        if (!ignore) setProduct(p)
      } catch (e) {
        if (!ignore) setProduct(null)
      }
    }
    load()
    return () => { ignore = true }
  }, [id])

  // Auto-select first size and color when product loads
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || '')
      setSelectedColor(product.colors?.[0] || '')
    }
  }, [product])

  // Close lightbox when switching products/colors so we don't show stale images
  useEffect(() => {
    setLightboxOpen(false)
    setLightboxIndex(0)
  }, [id, selectedColor])

  // Calculate current inventory based on selected color and size
  const currentInventory = useMemo(() => {
    if (!product?.inventory || !Array.isArray(product.inventory)) return null
    if (!selectedColor || !selectedSize) return null
    
    const item = product.inventory.find(
      inv => inv.color === selectedColor && inv.size === selectedSize
    )
    return item || null
  }, [product, selectedColor, selectedSize])

  const stockQuantity = currentInventory?.quantity || 0
  const isOutOfStock = stockQuantity === 0
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5

  const [date1, date2] = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })
    const now = new Date()
    const d1 = new Date(now)
    d1.setDate(now.getDate() + 1)
    const d2 = new Date(now)
    d2.setDate(now.getDate() + 2)
    return [fmt.format(d1), fmt.format(d2)]
  }, [])

  // Build media gallery: show color-specific images when color is selected, otherwise show placeholder
  // (Must be before early return to satisfy Rules of Hooks)
  const { mediaList, hasColorImages, imageMedia, videoMedia } = useMemo(() => {
    if (!product) {
      return { mediaList: [], hasColorImages: false, imageMedia: [], videoMedia: [] }
    }

    let list = []
    let hasImages = false

    if (selectedColor && product.colorImages && product.colorImages[selectedColor]) {
      list = product.colorImages[selectedColor] || []
      hasImages = list.length > 0
    } else if (!selectedColor) {
      const firstColor = product.colors?.[0]
      if (firstColor && product.colorImages && product.colorImages[firstColor]) {
        list = product.colorImages[firstColor] || []
        hasImages = list.length > 0
      }
    }

    const imgs = list.filter(m => !m.type || m.type === 'image')
    const vids = list.filter(m => m.type === 'video')

    return { mediaList: list, hasColorImages: hasImages, imageMedia: imgs, videoMedia: vids }
  }, [product, selectedColor])

  // Update lightbox images when product/color changes
  useEffect(() => {
    if (!product) {
      setLightboxImages([])
      return
    }
    const colorLabel = selectedColor ? ` - ${selectedColor}` : ''
    const imgs = (Array.isArray(imageMedia) ? imageMedia : [])
      .filter(m => m && m.url)
      .map((m, idx) => ({
        url: m.url,
        alt: `${product?.name || 'Product'}${colorLabel} ${idx + 1}`
      }))
    setLightboxImages(imgs)
  }, [imageMedia, product, selectedColor])

  const lightboxIndexByUrl = useMemo(() => {
    const map = new Map()
    lightboxImages.forEach((img, idx) => {
      if (img?.url) map.set(String(img.url), idx)
    })
    return map
  }, [lightboxImages])

  if (!product) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <p className="text-sm text-gray-700">Product not found.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </main>
    )
  }

  // Build ordered gallery: first image, then video, then remaining images
  const gallerySlots = []

  // First slot: always the first image if available
  if (imageMedia.length > 0) {
    gallerySlots.push({ type: 'image', url: imageMedia[0].url })
  }

  // Second slot: video if available
  if (videoMedia.length > 0) {
    gallerySlots.push({ type: 'video', url: videoMedia[0].url })
  }

  // Remaining slots: remaining images
  for (let i = 1; i < imageMedia.length; i++) {
    gallerySlots.push({ type: 'image', url: imageMedia[i].url })
  }

  const isTileVariantShape = Array.isArray(product.variants) && product.variants.length > 0 && product.variants[0]?.key && product.variants[0]?.label
  const isOptionGroupShape = Array.isArray(product.variants) && product.variants.length > 0 && product.variants[0]?.name && Array.isArray(product.variants[0]?.values)

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      {product.categoryTrail && (
        <nav className="mb-6 text-sm text-gray-500">
          {product.categoryTrail.map((c, idx) => (
            <span key={c}>
              {idx > 0 && <span className="mx-1">›</span>}
              <a href="#" className="hover:underline">{c}</a>
            </span>
          ))}
        </nav>
      )}

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left gallery: always 2x2 grid, show only uploaded media */}
        <div className="lg:col-span-8">
          {selectedColor && hasColorImages ? (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-1">
              {gallerySlots.map((slot, index) => (
                <div key={index} className="bg-gray-100 aspect-[4/5]">
                  {slot.type === 'video' ? (
                    <video
                      src={slot.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      alt={`${product.name} - ${selectedColor} video`}
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full h-full"
                      aria-label="Open image"
                      onClick={() => {
                        // Restore product images to lightbox (in case size chart was viewed)
                        const colorLabel = selectedColor ? ` - ${selectedColor}` : ''
                        const imgs = (Array.isArray(imageMedia) ? imageMedia : [])
                          .filter(m => m && m.url)
                          .map((m, idx) => ({
                            url: m.url,
                            alt: `${product?.name || 'Product'}${colorLabel} ${idx + 1}`
                          }))
                        setLightboxImages(imgs)
                        
                        // Find the index of the clicked image
                        const idx = imgs.findIndex(img => img.url === slot.url)
                        setLightboxIndex(idx >= 0 ? idx : 0)
                        setLightboxOpen(true)
                      }}
                    >
                      <img
                        src={slot.url}
                        alt={`${product.name} - ${selectedColor} ${index + 1}`}
                        className="w-full h-full object-cover cursor-zoom-in"
                      />
                    </button>
                  )}
                </div>
              ))}
              {/* Leave remaining slots empty - no placeholders or duplicates */}
            </div>
          ) : (
            <div className="bg-gray-100 aspect-[4/5] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">📷</div>
                <p className="text-sm">
                  {product.colors && product.colors.length > 0
                    ? "Select a color to view images"
                    : "No images available"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right info panel */}
        <aside className="lg:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{product.name}</h1>
              {(() => {
                const currentPrice = Number(product.price || 0)
                const originalPrice = Number(product.originalPrice || 0)
                const showOriginal = Number.isFinite(originalPrice) && originalPrice > currentPrice && product.showOriginalPrice !== false
                return (
                  <div className="mt-1 flex items-baseline gap-2">
                    {showOriginal && (
                      <span className="text-sm text-gray-500 line-through">{formatINR(originalPrice)}</span>
                    )}
                    <span className="text-lg text-gray-900">{formatINR(currentPrice)}</span>
                  </div>
                )
              })()}
            </div>
            <button
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={() => handleWishlistClick(currentProductId, product.name)}
              className={`p-2 border rounded-full hover:bg-gray-50 ${wished ? 'border-red-600 text-red-600' : 'border-gray-300 text-gray-700'}`}
            >
              {wished ? (
                <HeartIconSolid className="h-5 w-5 text-red-600" />
              ) : (
                <HeartIconOutline className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Variants */}
          {isTileVariantShape && (
            <div className="mt-5">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.variants.map(v => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedVariant(v.key)}
                    className={`shrink-0 rounded-md border ${selectedVariant === v.key ? 'border-gray-900' : 'border-gray-300'} p-1`}
                    aria-label={v.label}
                  >
                    <img src={v.image || v.url} alt={v.label} className="h-16 w-20 object-cover rounded" />
                  </button>
                ))}
                <button className="shrink-0 p-2" aria-label="More colors">
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {/* Labels row */}
              <div className="mt-2 flex items-center gap-6">
                {product.variants.slice(0, 5).map(v => (
                  <span key={v.key} className={`text-xs ${selectedVariant === v.key ? 'text-gray-900' : 'text-gray-600'}`}>{v.label}</span>
                ))}
              </div>
            </div>
          )}
          {isOptionGroupShape && (
            <div className="mt-5 space-y-3">
              {product.variants.map(group => (
                <div key={group.name}>
                  <div className="text-xs font-medium text-gray-900 mb-1">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {(group.values || []).map(val => {
                      const active = optionSelections[group.name] === val
                      return (
                        <button
                          key={val}
                          onClick={() => setOptionSelections(prev => ({ ...prev, [group.name]: val }))}
                          className={`text-xs px-2 py-1 rounded border ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300'}`}
                        >{val}</button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Color selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      selectedColor === color
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {!selectedColor && (
                <p className="text-xs text-gray-500 mt-2">Select a color to view product images</p>
              )}
            </div>
          )}

          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Size</h3>
                {product.sizeChartImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxImages([{ url: product.sizeChartImage, alt: 'Size Chart' }])
                      setLightboxIndex(0)
                      setLightboxOpen(true)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Size Chart
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      selectedSize === size
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status Display */}
          {selectedColor && selectedSize && (
            <div className="mt-4">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-orange-600 font-medium">Only {stockQuantity} left in stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-600 font-medium">In Stock ({stockQuantity} available)</span>
                </div>
              )}
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-4">
            <button
              onClick={() => {
                if (!product) return
                let opts = {}
                if (selectedSize) opts.size = selectedSize
                if (selectedColor) opts.color = selectedColor
                if (isTileVariantShape) {
                  const variantObj = product.variants?.find(v => v.key === selectedVariant)
                  opts = { ...opts, variant: selectedVariant, variantLabel: variantObj?.label }
                }
                if (isOptionGroupShape) {
                  opts = { ...opts, options: optionSelections }
                }
                addItem(product, opts)
                navigate('/cart')
              }}
              disabled={isOutOfStock}
              className={`w-full h-12 text-sm font-semibold rounded-md transition-colors ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>

            <button
              onClick={() => {
                if (!product || isOutOfStock) return
                let opts = {}
                if (selectedSize) opts.size = selectedSize
                if (selectedColor) opts.color = selectedColor
                if (isTileVariantShape) {
                  const variantObj = product.variants?.find(v => v.key === selectedVariant)
                  opts = { ...opts, variant: selectedVariant, variantLabel: variantObj?.label }
                }
                if (isOptionGroupShape) {
                  opts = { ...opts, options: optionSelections }
                }
                clear()
                addItem(product, opts)
                navigate('/checkout')
              }}
              disabled={isOutOfStock}
              className={`w-full h-12 mt-3 text-sm font-semibold rounded-md transition-colors border ${
                isOutOfStock
                  ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                  : 'border-black text-black bg-white hover:bg-gray-50'
              }`}
            >
              BUY NOW
            </button>
          </div>

          {/* Delivery estimate */}
          <div className="mt-4 text-sm text-gray-900">Estimated delivery date : {date1} - {date2}</div>

          

          {/* Collapsible sections */}
          <div className="mt-6 divide-y divide-gray-200 border border-gray-200 rounded-md">
            <details className="group" open>
              <summary className="list-none cursor-pointer px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
                Description
                <span className="ml-4 text-gray-500 group-open:rotate-90 transition-transform">›</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line">{product.description || 'No description available.'}</div>
            </details>
            <details className="group">
              <summary className="list-none cursor-pointer px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
                Environmental characteristics
                <span className="ml-4 text-gray-500 group-open:rotate-90 transition-transform">›</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-700">This item is produced with attention to environmental standards and responsible sourcing.</div>
            </details>
            <details className="group">
              <summary className="list-none cursor-pointer px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
                Delivery, Exchanges & Returns
                <span className="ml-4 text-gray-500 group-open:rotate-90 transition-transform">›</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-700">Free standard delivery. 30-day returns. Exchanges available in-store and online.</div>
            </details>
          </div>

        </aside>
      </div>

      {lightboxOpen && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIndex}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Recommended Products Section */}
      <div className="mt-20">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 py-3 mb-3">
          <h2 className="text-base md:text-lg font-semibold text-center text-gray-900 max-w-7xl mx-auto px-4">Recommended Products</h2>
        </div>
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
            {recommendedProducts.map((p) => {
              const pid = p.id || p._id
              const pidStr = String(pid)

              // Get primary image (check colorImages first, then fallback to images)
              let pImage = '/placeholder.jpg'

              // Check colorImages first (new structure)
              if (p.colorImages && typeof p.colorImages === 'object') {
                const colors = Object.keys(p.colorImages)
                for (const color of colors) {
                  const colorMedia = p.colorImages[color]
                  if (Array.isArray(colorMedia) && colorMedia.length > 0) {
                    const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
                    if (firstImage) {
                      pImage = firstImage.url
                      break
                    }
                  }
                }
              }

              // Fallback to old images array if no colorImages found
              if (pImage === '/placeholder.jpg') {
                pImage = p.image || p.images?.[0]?.url || '/placeholder.jpg'
              }

              const pPrice = Number(p.price || 0)
              const wished = wishlistIds.includes(pidStr)
              return (
                <div
                  key={`recommended-${pid}`}
                  className="group"
                >
                  <Link to={`/product/${pid}`} className="block aspect-[4/5] w-full bg-gray-100 overflow-hidden">
                    <img
                      src={pImage}
                      alt={p.name}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </Link>

                  {/* Name, price and wishlist button below the image (same as home page) */}
                  <div className="mt-2 flex items-center justify-between gap-2 px-2">
                    <div className="flex-1">
                      <Link to={`/product/${pid}`} className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug hover:underline">{p.name}</Link>
                      {(() => {
                        const orig = Number(p.originalPrice || 0)
                        const showOrig = Number.isFinite(orig) && orig > pPrice && p.showOriginalPrice !== false
                        return (
                          <div className="mt-1 flex items-baseline gap-2">
                            {showOrig && (
                              <span className="text-[11px] text-gray-500 line-through">{formatINR(orig)}</span>
                            )}
                            <span className="text-xs text-gray-700">{formatINR(pPrice)}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div>
                      <button
                        onClick={() => handleWishlistClick(pidStr, p.name)}
                        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-pressed={wished}
                        className={`${wished ? 'text-red-600' : 'text-gray-700'} p-1`}
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
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/search?section=recommended"
            className="inline-block px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            View More
          </Link>
        </div>
      </div>

      {/* Most Viewed Products Section */}
      <div className="mt-16">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 py-3 mb-3">
          <h2 className="text-base md:text-lg font-semibold text-center text-gray-900 max-w-7xl mx-auto px-4">Most Viewed</h2>
        </div>
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
            {mostViewedProducts.map((p) => {
              const pid = p.id || p._id
              const pidStr = String(pid)

              // Get primary image (check colorImages first, then fallback to images)
              let pImage = '/placeholder.jpg'

              // Check colorImages first (new structure)
              if (p.colorImages && typeof p.colorImages === 'object') {
                const colors = Object.keys(p.colorImages)
                for (const color of colors) {
                  const colorMedia = p.colorImages[color]
                  if (Array.isArray(colorMedia) && colorMedia.length > 0) {
                    const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
                    if (firstImage) {
                      pImage = firstImage.url
                      break
                    }
                  }
                }
              }

              // Fallback to old images array if no colorImages found
              if (pImage === '/placeholder.jpg') {
                pImage = p.image || p.images?.[0]?.url || '/placeholder.jpg'
              }

              const pPrice = Number(p.price || 0)
              const wished = wishlistIds.includes(pidStr)
              return (
                <div
                  key={`most-viewed-${pid}`}
                  className="group"
                >
                  <Link to={`/product/${pid}`} className="block aspect-[4/5] w-full bg-gray-100 overflow-hidden">
                    <img
                      src={pImage}
                      alt={p.name}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </Link>

                  {/* Name, price and wishlist button below the image (same as home page) */}
                  <div className="mt-2 flex items-center justify-between gap-2 px-2">
                    <div className="flex-1">
                      <Link to={`/product/${pid}`} className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug hover:underline">{p.name}</Link>
                      {(() => {
                        const orig = Number(p.originalPrice || 0)
                        const showOrig = Number.isFinite(orig) && orig > pPrice && p.showOriginalPrice !== false
                        return (
                          <div className="mt-1 flex items-baseline gap-2">
                            {showOrig && (
                              <span className="text-[11px] text-gray-500 line-through">{formatINR(orig)}</span>
                            )}
                            <span className="text-xs text-gray-700">{formatINR(pPrice)}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div>
                      <button
                        onClick={() => handleWishlistClick(pidStr, p.name)}
                        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-pressed={wished}
                        className={`${wished ? 'text-red-600' : 'text-gray-700'} p-1`}
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
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/search?section=most-viewed"
            className="inline-block px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            View More
          </Link>
        </div>
      </div>

      {/* Back link for navigation */}
      <div className="mt-4">
        <Link to="/" className="text-sm text-blue-600 hover:underline">Back to Home</Link>
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
    </main>
  )
}
