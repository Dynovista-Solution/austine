import { useAdmin } from './AdminContext.jsx'
import {
  CurrencyEuroIcon,
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function AdminAnalyticsPage() {
  const { isAdminLoggedIn, products } = useAdmin()

  // Mock analytics data - in a real app, this would come from an API
  const analytics = {
    overview: {
      totalRevenue: 45280.50,
      totalOrders: 342,
      totalCustomers: 128,
      totalProducts: products.length,
      revenueChange: 12.5,
      ordersChange: 8.2,
      customersChange: 15.3,
      productsChange: 5.1
    },
    monthlyData: [
      { month: 'Jan', revenue: 12500, orders: 95, customers: 45 },
      { month: 'Feb', revenue: 15200, orders: 110, customers: 52 },
      { month: 'Mar', revenue: 18900, orders: 125, customers: 58 },
      { month: 'Apr', revenue: 16800, orders: 98, customers: 48 },
      { month: 'May', revenue: 22100, orders: 142, customers: 65 },
      { month: 'Jun', revenue: 25600, orders: 156, customers: 72 },
      { month: 'Jul', revenue: 28900, orders: 178, customers: 78 },
      { month: 'Aug', revenue: 31200, orders: 192, customers: 85 },
      { month: 'Sep', revenue: 34800, orders: 215, customers: 92 },
      { month: 'Oct', revenue: 45280, orders: 342, customers: 128 }
    ],
    topProducts: [
      { id: '2', name: 'Patent leather Miss M Mini bag', sales: 45, revenue: 15075, image: '/products/product2.jpg' },
      { id: '1', name: 'Leather Ballerina', sales: 38, revenue: 4926.62, image: '/products/product11.jpg' },
      { id: '4', name: 'Chelsea Boots', sales: 32, revenue: 4768, image: '/products/product4.jpg' },
      { id: '3', name: 'Wool Sweater', sales: 28, revenue: 2772, image: '/products/product3.jpg' }
    ],
    customerStats: {
      newCustomers: 23,
      returningCustomers: 105,
      averageOrderValue: 132.42,
      customerLifetimeValue: 354.18
    },
    trafficSources: [
      { source: 'Direct', visitors: 4520, percentage: 45.2 },
      { source: 'Google Search', visitors: 2890, percentage: 28.9 },
      { source: 'Social Media', visitors: 1560, percentage: 15.6 },
      { source: 'Email', visitors: 680, percentage: 6.8 },
      { source: 'Other', visitors: 350, percentage: 3.5 }
    ]
  }

  const StatCard = ({ title, value, change, changeType, icon: Icon, format = 'number' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {format === 'currency' ? `₹${value.toLocaleString()}` : value.toLocaleString()}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">{Math.abs(change)}%</span>
              <span className="ml-1 text-gray-500">from last month</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-50 rounded-full">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
      </div>
    </div>
  )

  if (!isAdminLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive insights into your store performance.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={analytics.overview.totalRevenue}
          change={analytics.overview.revenueChange}
          changeType="increase"
          icon={CurrencyEuroIcon}
          format="currency"
        />
        <StatCard
          title="Total Orders"
          value={analytics.overview.totalOrders}
          change={analytics.overview.ordersChange}
          changeType="increase"
          icon={ShoppingBagIcon}
        />
        <StatCard
          title="Total Customers"
          value={analytics.overview.totalCustomers}
          change={analytics.overview.customersChange}
          changeType="increase"
          icon={UsersIcon}
        />
        <StatCard
          title="Total Products"
          value={analytics.overview.totalProducts}
          change={analytics.overview.productsChange}
          changeType="increase"
          icon={CubeIcon}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analytics.monthlyData.map((data, index) => {
              const maxRevenue = Math.max(...analytics.monthlyData.map(d => d.revenue))
              const height = (data.revenue / maxRevenue) * 100
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                  <span className="text-xs font-medium text-gray-900">₹{(data.revenue / 1000).toFixed(0)}k</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analytics.monthlyData.map((data, index) => {
              const maxOrders = Math.max(...analytics.monthlyData.map(d => d.orders))
              const height = (data.orders / maxOrders) * 100
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                  <span className="text-xs font-medium text-gray-900">{data.orders}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => {
              // Get primary image (check colorImages first, then fallback to images)
              let productImage = '/placeholder.jpg'

              // Check colorImages first (new structure)
              if (product.colorImages && typeof product.colorImages === 'object') {
                const colors = Object.keys(product.colorImages)
                for (const color of colors) {
                  const colorMedia = product.colorImages[color]
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
                productImage = product.image || product.images?.[0]?.url || '/placeholder.jpg'
              }

              return (
              <div key={product.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>
                <img src={productImage} alt={product.name} className="w-10 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales • ₹{product.revenue.toFixed(2)}</p>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Customer Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Customers</span>
              <span className="text-sm font-medium text-gray-900">{analytics.customerStats.newCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Returning Customers</span>
              <span className="text-sm font-medium text-gray-900">{analytics.customerStats.returningCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Order Value</span>
              <span className="text-sm font-medium text-gray-900">€{analytics.customerStats.averageOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer LTV</span>
              <span className="text-sm font-medium text-gray-900">€{analytics.customerStats.customerLifetimeValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {analytics.trafficSources.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{source.source}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {source.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}