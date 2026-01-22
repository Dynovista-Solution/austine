import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiService from '../services/api'
import {
  ArrowLeftIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [nextStatus, setNextStatus] = useState('')

  const orderRecordId = useMemo(() => order?._id || order?.id || id, [order, id])
  const orderDisplayId = useMemo(() => order?.orderNumber || order?._id || order?.id || id, [order, id])

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'confirmed':
        return 'bg-purple-100 text-purple-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <FunnelIcon className="w-4 h-4" />
      case 'shipped':
        return <TruckIcon className="w-4 h-4" />
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  async function fetchOrder() {
    try {
      setLoading(true)
      const res = await apiService.getOrder(id)
      const fetched = res?.data?.order || res?.order || null
      setOrder(fetched)
    } catch (e) {
      console.error('Failed to fetch order:', e)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (order?.status) setNextStatus(order.status)
  }, [order?.status])

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true)
      await apiService.updateOrderStatus(orderRecordId, newStatus)
      await fetchOrder()
      alert(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status. Please try again.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">Loading order...</div>
    )
  }

  if (!order) {
    return (
      <div className="py-12">
        <button
          type="button"
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="mt-8 rounded-md border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-700">Order not found.</p>
        </div>
      </div>
    )
  }

  const orderDate = order.createdAt || order.date

  const customerName = order.shippingAddress
    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
    : (order.customer?.name || 'N/A')
  const customerEmail = order.shippingAddress?.email || order.customer?.email || 'N/A'
  const customerPhone = order.shippingAddress?.phone || order.customer?.phone || 'N/A'

  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`
    : (order.shipping?.address || 'N/A')

  const items = Array.isArray(order.items) ? order.items : []

  const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  const canUpdateStatus = nextStatus && nextStatus !== order.status && !updatingStatus

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Orders
          </button>

          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Order Details</h1>
          <p className="mt-1 text-sm text-gray-600">{orderDisplayId}</p>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </span>
          <p className="mt-2 text-sm font-semibold text-gray-900">€{Number(order.total || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500">{orderDate ? new Date(orderDate).toLocaleString() : ''}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {customerName}</p>
            <p><span className="font-medium">Email:</span> {customerEmail}</p>
            <p><span className="font-medium">Phone:</span> {customerPhone}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Order Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Order ID:</span> {orderDisplayId}</p>
            <p><span className="font-medium">Date:</span> {orderDate ? new Date(orderDate).toLocaleDateString() : 'N/A'}</p>
            <p><span className="font-medium">Subtotal:</span> €{Number(order.subtotal || 0).toFixed(2)}</p>
            <p><span className="font-medium">Shipping:</span> €{Number(order.shipping || 0).toFixed(2)}</p>
            <p><span className="font-medium">Tax:</span> €{Number(order.tax || 0).toFixed(2)}</p>
            <p><span className="font-medium">Total:</span> €{Number(order.total || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Shipping Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Address:</span> {shippingAddress}</p>
            <p><span className="font-medium">Method:</span> {order.shipping?.method || 'Standard Shipping'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Payment Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Method:</span> {order.payment?.method || 'N/A'}</p>
            <p>
              <span className="font-medium">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                order.payment?.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {order.payment?.status || 'N/A'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No items found.</p>
          ) : (
            items.map((item, idx) => {
              let itemImage = '/placeholder.jpg'

              if (item.colorImages && typeof item.colorImages === 'object') {
                const colors = Object.keys(item.colorImages)
                for (const color of colors) {
                  const colorMedia = item.colorImages[color]
                  if (Array.isArray(colorMedia) && colorMedia.length > 0) {
                    const firstImage = colorMedia.find(m => !m.type || m.type === 'image')
                    if (firstImage) {
                      itemImage = firstImage.url
                      break
                    }
                  }
                }
              }

              if (itemImage === '/placeholder.jpg') {
                itemImage = item.image || item.images?.[0]?.url || '/placeholder.jpg'
              }

              return (
                <div key={item._id || item.id || idx} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                  <img src={itemImage} alt={item.name} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                    {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                  </div>
                  <p className="font-medium text-gray-900">€{Number(item.price || 0).toFixed(2)}</p>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Update Status</h2>
            <p className="mt-1 text-sm text-gray-600">Current: <span className="capitalize font-medium text-gray-900">{order.status}</span></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="sm:w-56">
              <label className="block text-xs font-medium text-gray-700 mb-1">New status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="block w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
              >
                {allowedStatuses.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!canUpdateStatus}
              onClick={() => {
                if (!nextStatus || nextStatus === order.status) return
                const ok = window.confirm(`Change status from "${order.status}" to "${nextStatus}"?`)
                if (!ok) return
                updateOrderStatus(nextStatus)
              }}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:opacity-50"
            >
              {updatingStatus ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
