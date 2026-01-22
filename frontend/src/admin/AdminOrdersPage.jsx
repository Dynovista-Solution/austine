import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import apiService from '../services/api'
import * as XLSX from 'xlsx'
import {
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

export default function AdminOrdersPage() {
  const { isAdminLoggedIn } = useAdmin()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const buildQueryParams = (overrides = {}) => {
    const q = {
      page: 1,
      limit: 200,
      sort: 'newest',
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: (searchTerm || '').trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minTotal: minTotal === '' ? undefined : minTotal,
      maxTotal: maxTotal === '' ? undefined : maxTotal
    }
    return { ...q, ...overrides }
  }

  async function fetchOrders(overrides = {}) {
    try {
      setLoading(true)
      const response = await apiService.getOrders(buildQueryParams(overrides))
      const fetchedOrders = response.data?.orders || response.orders || []
      setOrders(fetchedOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch orders from API (debounced) whenever filters change
  useEffect(() => {
    if (!isAdminLoggedIn) return
    const t = setTimeout(() => {
      fetchOrders()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminLoggedIn, searchTerm, statusFilter, dateFrom, dateTo, minTotal, maxTotal])

  // Mock orders data - fallback for demo
  const mockOrders = [
    {
      id: '#ORD-001',
      customer: { name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8900' },
      items: [
        { id: '1', name: 'Leather Ballerina', quantity: 1, price: 129.99, image: '/products/product11.jpg' },
        { id: '2', name: 'Patent leather Miss M Mini bag', quantity: 1, price: 335, image: '/products/product2.jpg' }
      ],
      total: 464.99,
      status: 'processing',
      date: '2025-10-09',
      shipping: { address: '123 Main St, New York, NY 10001', method: 'Express Shipping' },
      payment: { method: 'Credit Card', status: 'paid' }
    },
    {
      id: '#ORD-002',
      customer: { name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8901' },
      items: [
        { id: '3', name: 'Wool Sweater', quantity: 2, price: 99.0, image: '/products/product3.jpg' }
      ],
      total: 198.00,
      status: 'shipped',
      date: '2025-10-08',
      shipping: { address: '456 Oak Ave, Los Angeles, CA 90210', method: 'Standard Shipping' },
      payment: { method: 'PayPal', status: 'paid' }
    },
    {
      id: '#ORD-003',
      customer: { name: 'Mike Johnson', email: 'mike@example.com', phone: '+1 234 567 8902' },
      items: [
        { id: '4', name: 'Chelsea Boots', quantity: 1, price: 149.0, image: '/products/product4.jpg' }
      ],
      total: 149.00,
      status: 'delivered',
      date: '2025-10-07',
      shipping: { address: '789 Pine St, Chicago, IL 60601', method: 'Express Shipping' },
      payment: { method: 'Credit Card', status: 'paid' }
    },
    {
      id: '#ORD-004',
      customer: { name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1 234 567 8903' },
      items: [
        { id: '1', name: 'Leather Ballerina', quantity: 1, price: 129.99, image: '/products/product11.jpg' }
      ],
      total: 129.99,
      status: 'cancelled',
      date: '2025-10-06',
      shipping: { address: '321 Elm St, Houston, TX 77001', method: 'Standard Shipping' },
      payment: { method: 'Credit Card', status: 'refunded' }
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'confirmed': return 'bg-purple-100 text-purple-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <FunnelIcon className="w-4 h-4" />
      case 'shipped': return <TruckIcon className="w-4 h-4" />
      case 'delivered': return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />
      default: return null
    }
  }

  // Orders are server-filtered; keep variable name for existing table/export usage
  const filteredOrders = orders

  const exportOrdersToExcel = async () => {
    try {
      // Fetch ALL orders matching current filters (paged)
      const all = []
      let page = 1
      const limit = 500
      let pages = 1

      do {
        const response = await apiService.getOrders(buildQueryParams({ page, limit }))
        const batch = response.data?.orders || []
        const pagination = response.data?.pagination
        pages = pagination?.pages || 1

        all.push(...batch)

        // Safety: if API returns empty, stop
        if (!batch.length) break
        page += 1
        // Safety ceiling
        if (page > 500) break
      } while (page <= pages)

      if (!all.length) {
        alert('No orders to export')
        return
      }

      const rows = all.map(order => {
      const orderId = order.orderNumber || order._id || order.id || ''
      const createdAt = order.createdAt || order.date || ''
      const status = order.status || ''

      const shipping = order.shippingAddress || {}
      const customerName = shipping.firstName || shipping.lastName
        ? `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim()
        : (order.customer?.name || '')

      const email = shipping.email || order.customer?.email || ''
      const phone = shipping.phone || order.customer?.phone || ''

      const street = shipping.street || ''
      const city = shipping.city || ''
      const state = shipping.state || ''
      const zipCode = shipping.zipCode || ''
      const country = shipping.country || ''

      const paymentMethod = order.payment?.method || ''
      const paymentStatus = order.payment?.status || ''

      const items = Array.isArray(order.items) ? order.items : []
      const itemsCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
      const itemsSummary = items
        .map(i => `${i.name || 'Item'} x${i.quantity ?? 0}${i.size ? ` (${i.size})` : ''}${i.color ? ` (${i.color})` : ''}`)
        .join('; ')

      return {
        'Order ID': orderId,
        Date: createdAt ? new Date(createdAt).toISOString() : '',
        Status: status,
        Total: typeof order.total === 'number' ? order.total : Number(order.total || 0),
        Subtotal: typeof order.subtotal === 'number' ? order.subtotal : Number(order.subtotal || 0),
        Shipping: typeof order.shipping === 'number' ? order.shipping : Number(order.shipping || 0),
        Tax: typeof order.tax === 'number' ? order.tax : Number(order.tax || 0),
        'Payment Method': paymentMethod,
        'Payment Status': paymentStatus,
        'Customer Name': customerName,
        Email: email,
        Phone: phone,
        Street: street,
        City: city,
        State: state,
        'Zip Code': zipCode,
        Country: country,
        'Items Count': itemsCount,
        Items: itemsSummary
      }
      })

    const sheet = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Orders')

    const dateStamp = new Date().toISOString().slice(0, 10)
      const filterLabel = statusFilter && statusFilter !== 'all' ? `_${statusFilter}` : ''
      const filename = `orders${filterLabel}_${dateStamp}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (e) {
      console.error('Export failed:', e)
      alert(`Export failed: ${e?.message || 'Unknown error'}`)
    }
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Orders Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer orders, update statuses, and track deliveries.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders by ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="sm:w-40">
          <label className="sr-only">From date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="block w-full rounded-md border-0 bg-white py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="sm:w-40">
          <label className="sr-only">To date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="block w-full rounded-md border-0 bg-white py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="sm:w-32">
          <label className="sr-only">Min total</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="Min €"
            value={minTotal}
            onChange={(e) => setMinTotal(e.target.value)}
            className="block w-full rounded-md border-0 bg-white py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="sm:w-32">
          <label className="sr-only">Max total</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="Max €"
            value={maxTotal}
            onChange={(e) => setMaxTotal(e.target.value)}
            className="block w-full rounded-md border-0 bg-white py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="sm:w-auto">
          <button
            type="button"
            onClick={exportOrdersToExcel}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black hover:shadow-md transition-all duration-200"
            title="Download current orders (with applied filters) as Excel"
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const orderRecordId = order._id || order.id
                      const orderDisplayId = order.orderNumber || order._id || order.id
                      const orderDate = order.createdAt || order.date
                      const customerName = order.shippingAddress ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : (order.customer?.name || 'N/A')
                      const customerEmail = order.shippingAddress?.email || order.customer?.email || 'N/A'
                      
                      return (
                        <tr key={orderDisplayId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {orderDisplayId}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>
                              <div className="font-medium text-gray-900">{customerName}</div>
                              <div className="text-gray-500">{customerEmail}</div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(orderDate).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            €{order.total.toFixed(2)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => {
                                if (!orderRecordId) {
                                  alert('Order id missing')
                                  return
                                }
                                navigate(`/admin/orders/${orderRecordId}`)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}