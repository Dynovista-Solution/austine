import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: CubeIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Content', href: '/admin/content', icon: DocumentTextIcon },
  { name: 'Lookbook', href: '/admin/lookbook', icon: DocumentTextIcon },
]

export default function AdminLayout({ children }) {
  const { admin, adminLogout } = useAdmin()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const hasAdminSession = localStorage.getItem('adminSession:v1') === '1'

    // If someone tries to open admin without an admin session, send them to admin login.
    if (!hasAdminSession) {
      navigate('/admin/login')
      return
    }

    // If profile loaded but role isn't admin, kick them out.
    if (admin && admin.role !== 'admin' && admin.role !== 'super_admin') {
      adminLogout()
      navigate('/admin/login')
    }
  }, [admin, adminLogout, navigate])

  const handleLogout = () => {
    adminLogout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header - Full Width */}
      <div className="bg-black text-white">
        <div className="flex items-center justify-center h-16 px-4">
          <h1 className="text-xl font-bold text-center">AUSTINE Admin</h1>
        </div>
      </div>

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-16 z-30 w-56 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Admin info and logout */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {admin?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                  <p className="text-xs text-gray-500">{admin?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-56">
          {/* Top bar */}
          <div className="sticky top-16 z-10 bg-white border-b border-gray-200 lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              <div className="w-8" /> {/* Spacer */}
            </div>
          </div>

          {/* Page content */}
          <main className="px-6 pt-2 pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}