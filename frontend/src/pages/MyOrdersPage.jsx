import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import apiService from '../services/api.js'
import { formatINR } from '../utils/formatCurrency.js'
import { ShoppingBagIcon, ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function MyOrdersPage() {
  const { isLoggedIn, loading: userLoading } = useUser()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userLoading && !isLoggedIn) {
      navigate('/login')
      return
    }

    if (isLoggedIn) {
      fetchOrders()
    }
  }, [isLoggedIn, userLoading, navigate])

  async function fetchOrders() {
    try {
      setLoading(true)
      const response = await apiService.get('/orders/my')
      const ordersData = response?.data?.orders || response?.orders || []
      setOrders(ordersData)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusIcon(status) {
    const icons = {
      pending: ClockIcon,
      confirmed: CheckCircleIcon,
      processing: ClockIcon,
      shipped: TruckIcon,
      delivered: CheckCircleIcon,
      cancelled: XCircleIcon
    }
    const Icon = icons[status] || ClockIcon
    return <Icon className="w-4 h-4" />
  }

  if (userLoading || loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">View and track your order history</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to place your first order!</p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderNumber = order.orderNumber || order._id
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
              const itemCount = order.items?.length || 0
              const firstItem = order.items?.[0]

              return (
                <div 
                  key={order._id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Order #{orderNumber}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Placed on {orderDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-lg font-bold text-gray-900">{formatINR(order.total)}</p>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {firstItem && (
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                        <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {firstItem.image && (
                            <img 
                              src={firstItem.image} 
                              alt={firstItem.name} 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{firstItem.name}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Qty: {firstItem.quantity}
                            {firstItem.color && ` • ${firstItem.color}`}
                            {firstItem.size && ` • Size: ${firstItem.size}`}
                          </p>
                          {itemCount > 1 && (
                            <p className="text-xs text-gray-500 mt-1">+{itemCount - 1} more item{itemCount > 2 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-600">Payment: </span>
                          <span className="font-medium text-gray-900">
                            {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                          </span>
                        </div>
                        {order.payment?.status && (
                          <div>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              order.payment.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : order.payment.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.payment.status === 'paid' ? 'Paid' : 
                               order.payment.status === 'failed' ? 'Payment Failed' : 'Pending'}
                            </span>
                          </div>
                        )}
                      </div>
                      <Link 
                        to={`/order-confirmation/${orderNumber}`}
                        state={{ order }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Back to Profile */}
        <div className="mt-8 text-center">
          <Link 
            to="/profile" 
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
