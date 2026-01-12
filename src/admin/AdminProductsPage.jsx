import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import WarningDialog from '../components/WarningDialog.jsx'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

export default function AdminProductsPage() {
  const { isAdminLoggedIn, products, productsPagination, loading, loadProducts, addProduct, updateProduct, deleteProduct } = useAdmin()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50
  const [showAddModal, setShowAddModal] = useState(false) // legacy modal (unused)
  const [editingProduct, setEditingProduct] = useState(null) // legacy modal (unused)
  const [viewingInventory, setViewingInventory] = useState(null) // product whose inventory is being viewed
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, product: null })
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    description: ''
  })

  // Reset pagination when search changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  // Load products; use server-side search + pagination (debounced) for scalability.
  useEffect(() => {
    if (!isAdminLoggedIn) return
    const q = searchTerm.trim()
    const t = setTimeout(() => {
      // Admin products table currently hides inactive products, so request only active for clean pagination
      loadProducts({ search: q || undefined, sort: 'newest', page, limit, includeInactive: false })
    }, 300)
    return () => clearTimeout(t)
  }, [isAdminLoggedIn, loadProducts, searchTerm, page])

  // Products are already filtered server-side (search + pagination). Only hide inactive as a safety net.
  const filteredProducts = products.filter(product => product.isActive !== false)

  const handleAddProduct = () => {
    navigate('/admin/products/new')
  }

  const handleTotalProductsInventory = () => {
    navigate('/admin/products/inventory')
  }

  const handleEditProduct = (product) => {
    navigate(`/admin/products/${product.id || product._id}/edit`)
  }

  const handleUpdateProduct = () => {
    if (!formData.name || !formData.price || !formData.image) {
      alert('Please fill in all required fields')
      return
    }
    updateProduct(editingProduct.id, formData)
    setEditingProduct(null)
    resetForm()
  }

  const handleDeleteProduct = (product) => {
    setDeleteDialog({ isOpen: true, product })
  }

  const confirmDeleteProduct = async () => {
    if (deleteDialog.product) {
      try {
        const q = searchTerm.trim()
        await deleteProduct(
          deleteDialog.product.id || deleteDialog.product._id,
          { search: q || undefined, sort: 'newest', page, limit, includeInactive: false }
        )
        setDeleteDialog({ isOpen: false, product: null })
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete product: ' + error.message)
        setDeleteDialog({ isOpen: false, product: null })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      image: '',
      category: '',
      description: ''
    })
  }

  const ProductModal = ({ isOpen, onClose, onSubmit, title, submitText }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {submitText}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Inventory Modal Component
  const InventoryModal = () => {
    if (!viewingInventory) return null

    const inventory = viewingInventory.inventory || []
    const hasInventory = inventory.length > 0

    const handleClose = () => {
      console.log('Close button clicked')
      setViewingInventory(null)
    }

    // Group inventory by color
    const inventoryByColor = inventory.reduce((acc, item) => {
      if (!acc[item.color]) acc[item.color] = []
      acc[item.color].push(item)
      return acc
    }, {})

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory Details</h3>
              <p className="text-sm text-gray-500 mt-1">{viewingInventory.name}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!hasInventory ? (
              <div className="text-center py-12">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This product doesn't have any inventory entries yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(inventoryByColor).map(color => (
                  <div key={color} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 capitalize">Color: {color}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {inventoryByColor[color].map((item, idx) => {
                            const quantity = item.quantity || 0
                            const isOutOfStock = quantity === 0
                            const isLowStock = quantity > 0 && quantity <= 5
                            
                            return (
                              <tr key={idx} className={isOutOfStock ? 'bg-red-50' : ''}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.size}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`font-semibold ${
                                    isOutOfStock ? 'text-red-600' : 
                                    isLowStock ? 'text-orange-600' : 
                                    'text-green-600'
                                  }`}>
                                    {quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {isOutOfStock ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Out of Stock
                                    </span>
                                  ) : isLowStock ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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

                {/* Total Stock Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Stock</p>
                      <p className="text-xs text-blue-700 mt-0.5">All colors and sizes combined</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-semibold text-gray-900">Products Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product catalog - add, edit, or remove products.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTotalProductsInventory}
              className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black hover:shadow-md transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              title="View all products inventory"
            >
              <CubeIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              Total Products
            </button>
            <button
              onClick={handleAddProduct}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, SKU, category, subcategory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SKU
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading && filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        Loading products...
                      </td>
                    </tr>
                  ) : null}
                  {filteredProducts.map((product) => {
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
                    <tr key={product.id || product._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img className="h-10 w-10 rounded-lg object-cover" src={productImage} alt={product.name} />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.sku || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        €{product.price}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.category || 'N/A'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => navigate(`/admin/products/${product.id || product._id}/inventory`)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors duration-200 cursor-pointer"
                            title="View Inventory"
                          >
                            <CubeIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
                            title="Edit Product"
                          >
                            <PencilIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-200 cursor-pointer"
                            title="Delete Product"
                          >
                            <TrashIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{productsPagination?.page || page}</span> of{' '}
                  <span className="font-medium">{productsPagination?.pages || 1}</span>
                  {typeof productsPagination?.total === 'number' ? (
                    <span className="text-gray-500"> • {productsPagination.total} products</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={loading || page >= (productsPagination?.pages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Modal */}
      <InventoryModal />

      {/* Delete Confirmation Dialog */}
      <WarningDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null })}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.product?.name}"? This action cannot be undone and will permanently remove the product and all its data.`}
        confirmText="Delete Product"
        cancelText="Cancel"
      />

      {/* Legacy modals removed in favor of dedicated create/edit pages */}
    </div>
  )
}