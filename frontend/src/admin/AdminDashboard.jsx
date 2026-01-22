import { useEffect, useState } from 'react'
import { useAdmin } from './AdminContext.jsx'
import apiService from '../services/api'

export default function AdminDashboard() {
  const { isAdminLoggedIn } = useAdmin()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAdminLoggedIn) return
    let isMounted = true
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const res = await apiService.getAdminStats()
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
  }, [isAdminLoggedIn])

  const productsTotal = stats?.products?.active ?? 0
  const ordersTotal = stats?.orders?.total ?? 0
  const revenuePaidAllTime = stats?.revenue?.paidAllTime ?? 0

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
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
          <p className="text-sm font-medium text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">€{Number(revenuePaidAllTime || 0).toLocaleString()}</p>
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