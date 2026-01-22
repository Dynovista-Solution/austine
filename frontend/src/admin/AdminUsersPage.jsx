import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import apiService from '../services/api'
import WarningDialog from '../components/WarningDialog.jsx'
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'premium_customer', label: 'Premium Customer' },
  { value: 'admin', label: 'Admin' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

const formatRoleLabel = (role) => role.replace(/_/g, ' ')

const EMPTY_FORM = {
  name: '',
  email: '',
  role: 'customer',
  status: 'active',
  password: ''
}

export default function AdminUsersPage() {
  const { isAdminLoggedIn } = useAdmin()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null })

  const getRoleColor = useCallback((role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'premium_customer':
        return 'bg-purple-100 text-purple-800'
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'customer':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }, [])

  const getStatusColor = useCallback((status) => (
    status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  ), [])

  const fetchUsers = useCallback(async (targetPage = 1, searchValue = '') => {
    try {
      setLoading(true)
      setError('')
      const response = await apiService.getUsers({ page: targetPage, search: searchValue })
      if (!response.success) {
        throw new Error(response.message || 'Failed to load users')
      }
      const payload = response.data || {}
      const list = Array.isArray(payload.users) ? payload.users : []
      const paginationData = payload.pagination || {}

      const resolvedPage = paginationData.page || targetPage
      setUsers(list)
      setPagination({
        page: resolvedPage,
        limit: paginationData.limit || 20,
        total: paginationData.total || list.length,
        totalPages: Math.max(1, paginationData.totalPages || Math.ceil((paginationData.total || list.length) / (paginationData.limit || 20)))
      })

      setPage((prev) => (prev === resolvedPage ? prev : resolvedPage))
    } catch (err) {
      console.error('Failed to load users:', err)
      setUsers([])
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchUsers(page, debouncedSearch)
    }
  }, [fetchUsers, page, debouncedSearch, isAdminLoggedIn])

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setPage(1)
  }

  const openCreateModal = () => {
    setFormData(EMPTY_FORM)
    setModalError('')
    setShowAddModal(true)
  }

  const openEditModal = (user) => {
    // Kept name for minimal changes: now navigates to the edit page.
    navigate(`/admin/users/${user.id}/edit`)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setModalLoading(false)
    setModalError('')
    setFormData(EMPTY_FORM)
  }

  const handleCreateUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setModalError('Name, email, and password are required')
      return
    }

    try {
      setModalLoading(true)
      setModalError('')
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        password: formData.password.trim()
      }
      const response = await apiService.createUser(payload)
      if (!response.success) {
        throw new Error(response.message || 'Failed to create user')
      }
      closeModals()
      if (page === 1) {
        fetchUsers(1, debouncedSearch)
      } else {
        setPage(1)
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create user')
    } finally {
      setModalLoading(false)
    }
  }

  // Editing happens on /admin/users/:id/edit

  const handleDeleteRequest = (user) => {
    setDeleteDialog({ isOpen: true, user })
  }

  const confirmDeleteUser = async () => {
    const target = deleteDialog.user
    if (!target) return

    try {
      const response = await apiService.deleteUser(target.id)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user')
      }
      const shouldGoBack = users.length === 1 && page > 1
      const nextPage = shouldGoBack ? page - 1 : page
      if (shouldGoBack) {
        setPage(nextPage)
      } else {
        fetchUsers(page, debouncedSearch)
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user')
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
          <h1 className="text-2xl font-semibold text-gray-900">Users Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user accounts, roles, and access.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <UserPlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add User
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Orders
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total Spent
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Join Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => {
                    const canDelete = !['admin', 'super_admin'].includes(user.role)
                    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'
                    const totalSpent = Number(user.totalSpent || 0)
                    return (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {user.role === 'admin' || user.role === 'super_admin' ? (
                                  <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <UserIcon className="w-5 h-5 text-gray-600" />
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.name || 'Unnamed user'}</div>
                              <div className="text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {formatRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {user.ordersCount ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          €{totalSpent.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {joinDate}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit user"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteRequest(user)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete user"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <p>
          Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <UserModal
        isOpen={showAddModal}
        mode="create"
        title="Add New User"
        submitText="Add User"
        formData={formData}
        setFormData={setFormData}
        onClose={closeModals}
        onSubmit={handleCreateUser}
        loading={modalLoading}
        error={modalError}
      />

      {/* Edit now happens on a dedicated page: /admin/users/:id/edit */}

      <WarningDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={deleteDialog.user ? `Are you sure you want to delete "${deleteDialog.user.name}"? This action cannot be undone.` : 'Are you sure you want to delete this user?'}
        confirmText="Delete User"
        cancelText="Cancel"
      />
    </div>
  )
}

function UserModal({
  isOpen,
  mode,
  title,
  submitText,
  formData,
  setFormData,
  onClose,
  onSubmit,
  loading,
  error
}) {
  if (!isOpen) return null

  const isEdit = mode === 'edit'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEdit ? 'Reset Password' : 'Temporary Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isEdit ? 'Leave blank to keep current password' : 'Set an initial password'}
            />
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : submitText}
          </button>
        </div>
      </div>
    </div>
  )
}