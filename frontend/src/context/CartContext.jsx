import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart:v1')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('cart:v1', JSON.stringify(items))
    } catch {}
  }, [items])

  function getPrimaryImage(product, preferredColor) {
    // Prefer colorImages first (supports either plain object or Map)
    const colorImages = product?.colorImages
    if (colorImages) {
      const asMap = colorImages instanceof Map
      const getKeys = () => {
        if (asMap) return Array.from(colorImages.keys())
        if (typeof colorImages === 'object') return Object.keys(colorImages)
        return []
      }

      const getColorMedia = (color) => {
        if (!color) return null
        return asMap ? colorImages.get(color) : colorImages[color]
      }

      const tryColor = (color) => {
        const media = getColorMedia(color)
        if (!Array.isArray(media) || media.length === 0) return null
        const firstImage = media.find(m => !m?.type || m.type === 'image')
        return firstImage?.url || null
      }

      if (preferredColor) {
        const url = tryColor(preferredColor)
        if (url) return url
      }

      for (const color of getKeys()) {
        const url = tryColor(color)
        if (url) return url
      }
    }

    // Fallback to old images array / legacy image field
    const media = Array.isArray(product?.images) ? product.images : []
    const firstImage = media.find(m => !m?.type || m.type === 'image')
    return product?.image || firstImage?.url || media[0]?.url || '/placeholder.jpg'
  }

  function addItem(product, options = {}) {
    setItems(prev => {
      const pid = product.id || product._id
      const optColor = options.color || ''
      const optVariant = options.variant || ''
      const optSize = options.size || ''
      const optOptions = options.options ? JSON.stringify(options.options) : ''
      const key = [pid, optVariant, optColor, optSize, optOptions].join('|')
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      }
      const image = getPrimaryImage(product, options.color)
      const price = Number(product.price)
      return [...prev, { key, id: pid, name: product.name, price, image, qty: 1, ...options }]
    })
  }

  function updateQty(key, qty) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, qty: Math.max(1, qty) } : i))
  }

  function removeItem(key) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function clear() { setItems([]) }

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    return { subtotal }
  }, [items])

  const value = { items, addItem, updateQty, removeItem, clear, totals }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
