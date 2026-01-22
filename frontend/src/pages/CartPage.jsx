import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import WarningDialog from '../components/WarningDialog.jsx'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { formatINR } from '../utils/formatCurrency.js'

export default function CartPage() {
  const { items, updateQty, removeItem, clear, totals } = useCart()
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, item: null })
  const [clearDialog, setClearDialog] = useState(false)

  const confirmRemoveItem = () => {
    if (removeDialog.item) {
      removeItem(removeDialog.item.key)
    }
  }

  const confirmClearCart = () => {
    clear()
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="mb-6">
            <ShoppingBagIcon className="w-24 h-24 text-gray-300 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6 max-w-md">Looks like you haven't added anything to your cart yet. Start shopping to fill it up with amazing products!</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-900 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Items */}
          <div className="lg:col-span-8 space-y-6">
            {items.map(item => (
              <div key={item.key} className="flex items-start gap-4 border-b border-gray-100 pb-4">
                <div className="w-24 h-28 bg-gray-100 overflow-hidden">
                  <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-sm font-medium text-gray-900">{item.name}</h2>
                      <div className="mt-1 text-xs text-gray-600 space-x-2">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.variant && !item.color && <span>Color: {item.variantLabel || item.variant}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                    </div>
                    <button onClick={() => setRemoveDialog({ isOpen: true, item })} className="text-xs text-gray-500 hover:text-gray-900" aria-label="Remove item">Remove</button>
                  </div>
                  <div className="mt-2 flex items-center gap-6">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        className="px-2 py-1 text-sm"
                        aria-label="Decrease quantity"
                      >-</button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => updateQty(item.key, parseInt(e.target.value) || 1)}
                        className="w-12 text-center text-sm border-l border-r border-gray-300 py-1"
                      />
                      <button
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        className="px-2 py-1 text-sm"
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{formatINR(item.price * item.qty)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-4 border border-gray-200 rounded-md p-5 h-fit">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="font-medium text-gray-900">{formatINR(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd className="text-gray-600">Calculated at checkout</dd></div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-sm font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            <Link to="/checkout" className="mt-5 w-full h-12 bg-black text-white text-sm font-semibold rounded-md flex items-center justify-center">CHECKOUT</Link>
            <button onClick={() => setClearDialog(true)} className="mt-3 w-full text-xs text-gray-500 hover:text-gray-900 underline">Clear cart</button>
            <Link to="/" className="mt-4 block text-xs text-blue-600 hover:underline text-center">Continue shopping</Link>
          </aside>
        </div>
      )}

      {/* Remove Item Confirmation Dialog */}
      <WarningDialog
        isOpen={removeDialog.isOpen}
        onClose={() => setRemoveDialog({ isOpen: false, item: null })}
        onConfirm={confirmRemoveItem}
        title="Remove Item"
        message={`Are you sure you want to remove "${removeDialog.item?.name}" from your cart?`}
        confirmText="Remove Item"
        cancelText="Keep Item"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />

      <WarningDialog
        isOpen={clearDialog}
        onClose={() => setClearDialog(false)}
        onConfirm={confirmClearCart}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </main>
  )
}
