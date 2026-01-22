import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import apiService from '../services/api'
import { formatINR } from '../utils/formatCurrency.js'

export default function CheckoutPage() {
  const { items, totals, clear } = useCart()
  const { isLoggedIn } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (items.length === 0) navigate('/cart')
  }, [items, navigate])

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postal: '',
    country: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function updateField(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function validate() {
    const req = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'postal', 'country']
    const next = {}
    req.forEach(k => { if (!form[k].trim()) next[k] = 'Required' })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    if (!isLoggedIn) {
      // Redirect to login for authenticated checkout
      navigate('/login')
      return
    }
    setSubmitting(true)
    try {
      // Map cart items to order items payload
      const orderItems = items.map(i => ({
        product: i.id,
        quantity: i.qty,
        size: i.size,
        color: i.color || i.variantLabel || i.variant
      }))
      const shippingAddress = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        street: form.address,
        city: form.city,
        state: '',
        zipCode: form.postal,
        country: form.country
      }
      const payload = {
        items: orderItems,
        shippingAddress,
        payment: { method: 'cod' }
      }
      const res = await apiService.post('/orders', payload)
      const order = res?.data?.order || res?.data
      // Clear cart after successful order
      clear()
      // Navigate to confirmation with order data
      navigate('/order-confirmation', { state: { order } })
    } catch (err) {
      console.error('Order creation error:', err)
      alert('Failed to create order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
        {/* Form sections */}
        <div className="lg:col-span-8 space-y-10">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                <input name="firstName" value={form.firstName} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                <input name="lastName" value={form.lastName} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="+1 234 567 8900" />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Shipping address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input name="address" value={form.address} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input name="city" value={form.city} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Postal code</label>
                <input name="postal" value={form.postal} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errors.postal && <p className="text-xs text-red-600 mt-1">{errors.postal}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <input name="country" value={form.country} onChange={updateField} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
              </div>
            </div>
          </section>

          <div>
            <button disabled={submitting} className="w-full sm:w-auto h-12 px-8 bg-black text-white text-sm font-semibold rounded-md disabled:opacity-50">
              {submitting ? 'Processing...' : 'Place order'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4 border border-gray-200 rounded-md p-5 h-fit space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Order Summary</h2>
          <ul className="divide-y divide-gray-100">
            {items.map(i => (
              <li key={i.key} className="py-3 flex gap-4">
                <div className="w-16 h-20 bg-gray-100 overflow-hidden">
                  <img src={i.image || '/placeholder.jpg'} alt={i.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{i.name}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Qty {i.qty}{i.variantLabel ? ` · ${i.variantLabel}` : ''}{i.size ? ` · ${i.size}` : ''}</p>
                </div>
                <div className="text-xs font-medium text-gray-900">{formatINR(i.price * i.qty)}</div>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="text-gray-600">Calculated later</span></div>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-4 text-sm font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
        </aside>
      </form>
    </main>
  )
}
