import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { UserIcon, ShoppingBagIcon, HeartIcon, CreditCardIcon, MapPinIcon, PencilIcon, ArrowRightOnRectangleIcon, DocumentTextIcon, TruckIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../utils/formatCurrency.js'

export default function ProfilePage() {
  const { user, isLoggedIn, update, logout, loading } = useUser()
  const navigate = useNavigate()
  const { ids: wishlistIds } = useWishlist()
  const { items: cartItems } = useCart()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(user)

  // Redirect to login if not logged in (use effect to avoid navigation during render)
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/login')
    }
  }, [loading, isLoggedIn, navigate])

  // Wait for initial load
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not logged in or user data not loaded (navigation will happen in effect)
  if (!isLoggedIn || !user) {
    return null
  }

  function startEdit() {
    setDraft(user)
    setEditing(true)
  }
  function cancel() {
    setEditing(false)
  }
  function save() {
    update(draft)
    setEditing(false)
  }

  function change(e) {
    const { name, value } = e.target
    setDraft(d => ({ ...d, [name]: value }))
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.firstName || 'Valued Customer'}!
              </h1>
              <p className="text-gray-600 mt-1">{user.email || 'Complete your profile to get personalized recommendations'}</p>
            </div>
            <div className="hidden sm:flex gap-3">
              <Link
                to="/cart"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                <ShoppingBagIcon className="w-4 h-4" />
                View Cart
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                <HeartIcon className="w-4 h-4" />
                Wishlist
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cartItems.reduce((s,i)=>s+i.qty,0)}</p>
                <p className="text-sm text-gray-600">Items in Cart</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{wishlistIds.length}</p>
                <p className="text-sm text-gray-600">Saved Items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatINR(cartItems.reduce((s, i) => s + i.price * i.qty, 0))}</p>
                <p className="text-sm text-gray-600">Cart Total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  </div>
                  {!editing && (
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-gray-900 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {!editing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Details</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Name:</span> {user.firstName || '—'} {user.lastName || ''}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Email:</span> {user.email || '—'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {user.address ? `${user.address}\n${user.city || ''} ${user.postal || ''}\n${user.country || ''}` : 'No address saved'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          name="firstName"
                          value={draft.firstName || ''}
                          onChange={change}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          name="lastName"
                          value={draft.lastName || ''}
                          onChange={change}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          name="email"
                          type="email"
                          value={draft.email || ''}
                          onChange={change}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Shipping Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                          <input
                            name="address"
                            value={draft.address || ''}
                            onChange={change}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            name="city"
                            value={draft.city || ''}
                            onChange={change}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                          <input
                            name="postal"
                            value={draft.postal || ''}
                            onChange={change}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                          <input
                            name="country"
                            value={draft.country || ''}
                            onChange={change}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={save}
                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={cancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">My Orders</span>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/track-order"
                  className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Track Your Order</span>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/"
                  className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Continue Shopping</span>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-3">
                <button
                  onClick={logout}
                  className="flex items-center justify-between w-full p-3 bg-red-50 hover:bg-red-100 rounded-md transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
