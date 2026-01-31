import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import WarningDialog from '../components/WarningDialog.jsx'
import { HeartIcon } from '@heroicons/react/24/outline'
import { formatINR } from '../utils/formatCurrency.js'

export default function WishlistPage() {
  const { items, remove, clear } = useWishlist()
  const { addItem } = useCart()
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, item: null })
  const [clearDialog, setClearDialog] = useState(false)

  const confirmRemoveItem = () => {
    if (removeDialog.item) {
      remove(removeDialog.item)
    }
  }

  const confirmClearWishlist = () => {
    clear()
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Wishlist</h1>
        {items.length > 0 && (
          <button onClick={() => setClearDialog(true)} className="text-xs text-gray-500 hover:text-gray-900 underline">Clear all</button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="mb-6">
            <HeartIcon className="w-24 h-24 text-gray-300 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6 max-w-md">Save your favorite items here to keep track of what you love and want to purchase later!</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-900 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(p => {
            const productId = p.id || p._id

            // Get primary image (check colorImages first, then fallback to images)
            let productImage = '/placeholder.jpg'

            // Check colorImages first (new structure)
            if (p.colorImages && typeof p.colorImages === 'object') {
              const colors = Object.keys(p.colorImages)
              for (const color of colors) {
                const colorMedia = p.colorImages[color]
                if (Array.isArray(colorMedia) && colorMedia.length > 0) {
                  const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
                  if (firstImage) {
                    productImage = firstImage.url
                    break
                  }
                }
              }
            }

            // Fallback to old images array if no colorImages found
            if (productImage === '/placeholder.jpg') {
              productImage = p.image || p.images?.[0]?.url || '/placeholder.jpg'
            }

            const currentPrice = Number(p.price || 0)
            const originalPrice = Number(p.originalPrice || 0)
            const showOriginal = Number.isFinite(originalPrice) && originalPrice > currentPrice && p.showOriginalPrice !== false
            
            return (
              <li key={productId} className="group">
                <Link to={`/product/${productId}`} className="block relative aspect-[4/5] bg-gray-100 overflow-hidden">
                  <img src={productImage} alt={p.name} className="w-full h-full object-cover" />
                </Link>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/product/${productId}`} className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug hover:underline">{p.name}</Link>
                    <div className="mt-1 flex items-baseline gap-2">
                      {showOriginal && (
                        <span className="text-[11px] text-gray-500 line-through">{formatINR(originalPrice)}</span>
                      )}
                      <span className="text-xs text-gray-700">{formatINR(currentPrice)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => addItem(p)}
                      className="px-2 py-1 bg-black text-white text-[11px] rounded-md hover:bg-gray-900"
                    >Add to cart</button>
                    <button
                      onClick={() => setRemoveDialog({ isOpen: true, item: productId })}
                      className="text-[11px] text-gray-500 hover:text-gray-900 underline"
                    >Remove</button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Remove Item Confirmation Dialog */}
      <WarningDialog
        isOpen={removeDialog.isOpen}
        onClose={() => setRemoveDialog({ isOpen: false, item: null })}
        onConfirm={confirmRemoveItem}
        title="Remove from Wishlist"
        message="Are you sure you want to remove this item from your wishlist?"
        confirmText="Remove Item"
        cancelText="Keep Item"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />

      {/* Clear Wishlist Confirmation Dialog */}
      <WarningDialog
        isOpen={clearDialog}
        onClose={() => setClearDialog(false)}
        onConfirm={confirmClearWishlist}
        title="Clear Wishlist"
        message="Are you sure you want to remove all items from your wishlist? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </main>
  )
}
