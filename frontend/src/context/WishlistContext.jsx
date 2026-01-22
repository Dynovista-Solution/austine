import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAdmin } from '../admin/AdminContext.jsx'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { products } = useAdmin()
  const [ids, setIds] = useState(() => {
    try {
      const stored = localStorage.getItem('wishlist:v1')
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try { localStorage.setItem('wishlist:v1', JSON.stringify(ids)) } catch {}
  }, [ids])

  function toggle(productId) {
    const idStr = String(productId)
    setIds(prev => prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr])
  }
  function remove(productId) {
    const idStr = String(productId)
    setIds(prev => prev.filter(id => id !== idStr))
  }
  function clear() { setIds([]) }

  const items = useMemo(() => {
    return ids.map(id => {
      const idStr = String(id)
      return products.find(p => String(p.id) === idStr || String(p._id) === idStr)
    }).filter(Boolean)
  }, [ids, products])

  return (
    <WishlistContext.Provider value={{ ids, items, toggle, remove, clear }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
