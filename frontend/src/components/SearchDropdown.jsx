import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import apiService from '../services/api'
import { formatINR } from '../utils/formatCurrency.js'

export default function SearchDropdown({ open, onClose, categories = [], initialTerm = '', topOffset = 0 }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const scrollerRef = useRef(null)

  const [term, setTerm] = useState('')
  const [suggested, setSuggested] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const isSearching = Boolean((term || '').trim())
  const categoryLinks = useMemo(() => (Array.isArray(categories) ? categories : []).slice(0, 7), [categories])
  const dynamicCategoryLinks = useMemo(() => {
    if (!isSearching) return categoryLinks

    const seen = new Set()
    const links = []
    for (const p of Array.isArray(results) ? results : []) {
      const c = (p?.category || '').toString().trim()
      if (!c) continue
      const key = c.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      links.push({ name: c })
      if (links.length >= 7) break
    }
    return links
  }, [isSearching, results, categoryLinks])

  useEffect(() => {
    if (!open) return
    setTerm((initialTerm || '').toString())
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open, initialTerm])

  // Debounced search within the dropdown
  useEffect(() => {
    let ignore = false
    if (!open) return () => {}

    const q = (term || '').trim()
    if (!q) {
      setResults([])
      return () => {}
    }

    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiService.getProducts({ search: q, page: 1, limit: 12, sort: 'newest' })
        const products = res?.data?.products || []
        if (!ignore) setResults(products)
      } catch (e) {
        if (!ignore) setResults([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }, 250)

    return () => {
      ignore = true
      clearTimeout(t)
    }
  }, [open, term])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!open) return
      if (suggested.length) return
      setLoading(true)
      try {
        const res = await apiService.getProducts({ page: 1, limit: 12, sort: 'popular' })
        const products = res?.data?.products || []
        if (!ignore) setSuggested(products)
      } catch (e) {
        // If backend doesn't support sort/popular, fallback to basic list
        try {
          const res2 = await apiService.getProducts({ page: 1, limit: 12 })
          const products2 = res2?.data?.products || []
          if (!ignore) setSuggested(products2)
        } catch {
          if (!ignore) setSuggested([])
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const submit = () => {
    const q = term.trim()
    if (!q) return
    onClose?.()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const scrollCarousel = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.8))
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  const getProductImage = (p) => {
    let img = '/placeholder.jpg'
    if (p?.colorImages && typeof p.colorImages === 'object') {
      const colors = Object.keys(p.colorImages)
      for (const color of colors) {
        const colorMedia = p.colorImages[color]
        if (Array.isArray(colorMedia) && colorMedia.length > 0) {
          const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
          if (firstImage?.url) {
            img = firstImage.url
            break
          }
        }
      }
    }
    if (img === '/placeholder.jpg') {
      const media = Array.isArray(p?.images) ? p.images : []
      const firstImage = media.find(m => !m.type || m.type === 'image')
      img = firstImage?.url || p?.image || '/placeholder.jpg'
    }
    return img
  }

  const listToShow = (term || '').trim() ? results : suggested

  return (
    <div className="fixed left-0 right-0 bottom-0 z-40" style={{ top: `${Number(topOffset) || 0}px` }}>
      {/* Backdrop (below header only) */}
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
      />

      {/* Panel */}
      <div className="relative w-full h-full bg-white shadow-sm overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto">
            {/* Search bar */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                }}
                placeholder="Search"
                className="w-full h-12 rounded-full border border-gray-300 bg-white pl-12 pr-12 text-sm focus:outline-none focus:border-black"
              />
              <button
                type="button"
                aria-label={term ? 'Clear search' : 'Close search'}
                onClick={() => {
                  if (term) setTerm('')
                  else onClose?.()
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">You may also like</h2>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollCarousel(-1)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(1)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="mt-4 text-sm text-gray-500">Loading…</div>
              ) : (
                <div className="mt-4 relative">
                  {/* Mobile arrows */}
                  <button
                    type="button"
                    onClick={() => scrollCarousel(-1)}
                    className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full"
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(1)}
                    className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full"
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-700" />
                  </button>

                  <div
                    ref={scrollerRef}
                    className="flex gap-6 overflow-x-auto scroll-smooth pb-2 pr-2"
                  >
                    {(listToShow || []).slice(0, 12).map((p) => {
                      const pid = p.id || p._id
                      const img = getProductImage(p)
                      return (
                        <Link
                          key={pid}
                          to={`/product/${pid}`}
                          onClick={onClose}
                          className="min-w-[200px] max-w-[200px]"
                        >
                          <div className="bg-gray-100 aspect-square overflow-hidden">
                            <img src={img} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="mt-2 text-xs text-gray-900 font-medium line-clamp-2">{p.name}</div>
                          <div className="text-xs text-gray-700">{formatINR(p.price || 0)}</div>
                        </Link>
                      )
                    })}
                  </div>

                  {(term || '').trim() && (listToShow || []).length === 0 && (
                    <div className="mt-3 text-sm text-gray-600">No products found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mt-12">
              <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-xs">
                {dynamicCategoryLinks.map((c) => (
                  <Link
                    key={c.name}
                    to={`/category/${encodeURIComponent(c.name)}`}
                    onClick={onClose}
                    className="underline underline-offset-4 text-gray-900"
                  >
                    {c.name}
                  </Link>
                ))}
                {isSearching && dynamicCategoryLinks.length === 0 && (
                  <span className="text-gray-500">No categories found.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
