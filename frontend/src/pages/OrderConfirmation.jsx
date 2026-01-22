import { useLocation, Link } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { formatINR } from '../utils/formatCurrency.js'

export default function OrderConfirmation() {
  const { state } = useLocation()
  const order = state?.order

  if (!order) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-16 min-h-[50vh] flex flex-col items-center justify-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">No order found</h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">Return home</Link>
      </main>
    )
  }

  // Handle both order structures (API response and fallback)
  const orderNumber = order.orderNumber || order._id || 'N/A'
  const customerEmail = order.shippingAddress?.email || order.form?.email || 'your email'
  const orderItems = order.items || []
  const orderTotal = order.total || order.subtotal || 0

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon and Message */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-lg text-gray-600">Thank you for your purchase</p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Order Number</p>
              <p className="font-semibold text-gray-900">{orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Confirmation Email</p>
              <p className="font-semibold text-gray-900">{customerEmail}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-6 text-center">
          A confirmation email has been sent to <span className="font-medium">{customerEmail}</span>
        </p>

        {/* Order Items */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 mb-8">
          <div className="bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Order Summary</h2>
          </div>
          {orderItems.map((item, idx) => {
            const itemKey = item._id || item.id || item.key || idx
            const itemName = item.name || 'Product'
            const itemImage = item.image || '/placeholder.jpg'
            const itemPrice = item.price || 0
            const itemQty = item.quantity || item.qty || 1
            const itemSize = item.size || ''
            const itemColor = item.color || item.variantLabel || ''

            return (
              <div key={itemKey} className="flex items-start gap-4 p-4">
                <div className="w-16 h-20 bg-gray-100 overflow-hidden rounded">
                  <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{itemName}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Qty: {itemQty}
                    {itemColor && ` • ${itemColor}`}
                    {itemSize && ` • Size: ${itemSize}`}
                  </p>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatINR(itemPrice * itemQty)}
                </div>
              </div>
            )
          })}
          <div className="bg-gray-50 p-4 flex justify-between text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatINR(orderTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link 
            to="/account/orders" 
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-50 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>
    </main>
  )
}
