import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import { CubeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AdminProductInventory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProductById } = useAdmin()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true)
        const productData = await getProductById(id)
        setProduct(productData)
      } catch (error) {
        console.error('Failed to load product:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id, getProductById])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <button
            onClick={() => navigate('/admin/products')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  const inventory = product.inventory || []
  const hasInventory = inventory.length > 0

  // Group inventory by color
  const inventoryByColor = inventory.reduce((acc, item) => {
    if (!acc[item.color]) acc[item.color] = []
    acc[item.color].push(item)
    return acc
  }, {})

  const totalStock = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Products
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Details</h1>
              <p className="mt-2 text-lg text-gray-600">{product.name}</p>
              {product.sku && (
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              )}
            </div>
            <div className="bg-blue-100 rounded-lg px-6 py-4 text-center">
              <p className="text-sm font-medium text-blue-900">Total Stock</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{totalStock}</p>
            </div>
          </div>
        </div>

        {/* Inventory Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {!hasInventory ? (
            <div className="text-center py-16 px-4">
              <CubeIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No inventory data</h3>
              <p className="mt-2 text-sm text-gray-500">
                This product doesn't have any inventory entries yet.
              </p>
              <button
                onClick={() => navigate(`/admin/products/${id}/edit`)}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Product
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {Object.keys(inventoryByColor).map(color => (
                <div key={color} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 capitalize">
                      Color: {color}
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryByColor[color].map((item, idx) => {
                          const quantity = item.quantity || 0
                          const isOutOfStock = quantity === 0
                          const isLowStock = quantity > 0 && quantity <= 5
                          
                          return (
                            <tr key={idx} className={isOutOfStock ? 'bg-red-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.size}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`font-semibold text-lg ${
                                  isOutOfStock ? 'text-red-600' : 
                                  isLowStock ? 'text-orange-600' : 
                                  'text-green-600'
                                }`}>
                                  {quantity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {isOutOfStock ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Out of Stock
                                  </span>
                                ) : isLowStock ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    In Stock
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900">In Stock Items</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {inventory.filter(i => (i.quantity || 0) > 5).length}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-900">Low Stock Items</p>
                  <p className="text-2xl font-bold text-orange-900 mt-2">
                    {inventory.filter(i => {
                      const qty = i.quantity || 0
                      return qty > 0 && qty <= 5
                    }).length}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-900">Out of Stock Items</p>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {inventory.filter(i => (i.quantity || 0) === 0).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate(`/admin/products/${id}/edit`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Product
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    </div>
  )
}
