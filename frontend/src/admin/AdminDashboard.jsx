import { useEffect, useState } from 'react'
import { useAdmin } from './AdminContext.jsx'
import apiService from '../services/api'
import { UserGroupIcon, UserPlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { isAdminLoggedIn } = useAdmin()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Date filter state - default to last 30 days
  const getDefaultDates = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }
  
  const [dateRange, setDateRange] = useState(getDefaultDates())

  useEffect(() => {
    if (!isAdminLoggedIn) return
    let isMounted = true
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const res = await apiService.getAdminStats(dateRange.startDate, dateRange.endDate)
        if (!isMounted) return
        if (res?.success) {
          setStats(res.data)
        } else {
          throw new Error(res?.message || 'Failed to load dashboard stats')
        }
      } catch (e) {
        if (!isMounted) return
        setError(e.message || 'Failed to load dashboard stats')
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }
    run()
    return () => { isMounted = false }
  }, [isAdminLoggedIn, dateRange])

  const productsTotal = stats?.products?.active ?? 0
  const ordersTotal = stats?.orders?.total ?? 0
  const revenuePaidInRange = stats?.revenue?.paidInRange ?? 0
  const revenuePaidAllTime = stats?.revenue?.paidAllTime ?? 0
  const newCustomers = stats?.customers?.new ?? 0
  const repeatCustomers = stats?.customers?.repeat ?? 0
  const newCustomersLast30Days = stats?.customers?.newLast30Days ?? 0

  const totalCustomers = newCustomers + repeatCustomers
  const newCustomerPercentage = totalCustomers > 0 ? ((newCustomers / totalCustomers) * 100).toFixed(1) : 0
  const repeatCustomerPercentage = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setDateRange(getDefaultDates())}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset to Last 30 Days
          </button>
        </div>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Status</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? 'Loading...' : 'Active'}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{productsTotal}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{ordersTotal}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Revenue (Selected Period)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{Number(revenuePaidInRange || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">All-time: ₹{Number(revenuePaidAllTime || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Customer Analytics Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* New Customers */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-900">New Customers</p>
              <UserPlusIcon className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{newCustomers}</p>
            <p className="text-sm text-blue-700 mt-1">{newCustomerPercentage}% of total</p>
          </div>

          {/* Repeat Customers */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-900">Repeat Customers</p>
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{repeatCustomers}</p>
            <p className="text-sm text-green-700 mt-1">{repeatCustomerPercentage}% of total</p>
          </div>

          {/* New in Selected Period */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-900">New Registrations</p>
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{newCustomersLast30Days}</p>
            <p className="text-sm text-purple-700 mt-1">Selected period</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  )
}