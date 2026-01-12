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

  function addItem(product, options = {}) {
    setItems(prev => {
      const pid = product.id || product._id
      const key = pid + '|' + (options.variant || '') + '|' + (options.size || '')
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      }
  const media = Array.isArray(product.images) ? product.images : []
  const image = product.image || media.find(m => !m.type || m.type === 'image')?.url || media[0]?.url
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
