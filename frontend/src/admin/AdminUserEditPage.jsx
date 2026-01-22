import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiService from '../services/api'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'premium_customer', label: 'Premium Customer' },
  { value: 'admin', label: 'Admin' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

export default function AdminUserEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer',
    status: 'active',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const title = useMemo(() => (id ? 'Edit User' : 'Edit User'), [id])

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await apiService.getUser(id)
        if (!res?.success) throw new Error(res?.message || 'Failed to load user')
        const user = res?.data?.user || res?.data
        if (!ignore) {
          setFormData({
            name: user?.name || '',
            email: user?.email || '',
            role: user?.role || 'customer',
            status: user?.status || (user?.isActive ? 'active' : 'inactive'),
            password: ''
          })
        }
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load user')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    if (id) load()
    return () => { ignore = true }
  }, [id])

  const onChange = (key) => (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
      setError('New password must be at least 6 characters or left blank')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status
      }
      if (formData.password.trim()) payload.password = formData.password.trim()

      const res = await apiService.updateUser(id, payload)
      if (!res?.success) throw new Error(res?.message || 'Failed to update user')

      navigate('/admin/users')
    } catch (e) {
      setError(e?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl text-center">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-600">Update user details, role, status, or reset password.</p>
          </div>
          <Link to="/admin/users" className="text-sm text-blue-600 hover:underline whitespace-nowrap">Back</Link>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-gray-600">Loading…</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 bg-white border border-gray-200 rounded-lg p-6 space-y-4 text-left">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={onChange('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={onChange('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={onChange('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={onChange('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reset Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={onChange('password')}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank to keep current password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={saving}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  )
}
