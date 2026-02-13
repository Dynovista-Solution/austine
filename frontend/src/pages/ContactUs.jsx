import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export default function ContactUs() {
  useEffect(() => {
    document.title = 'Contact Us'
  }, [])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.email.trim() && form.message.trim())
  }, [form])

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    try {
      await api.sendContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message
      })
      setStatus({ type: 'success', message: 'Thanks! Your message has been sent.' })
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Failed to send message.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Us</h1>

        <div className="mt-6 text-sm text-gray-700 leading-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">CONTACT DETAILS</p>
            <p><span className="font-semibold text-gray-900">Brand:</span> Austine Lifestyle LLP</p>
            <p>
              <span className="font-semibold text-gray-900">Email:</span>{' '}
              <a className="text-blue-600 hover:underline" href="mailto:info.austinelifestyle@gmail.com">
                info.austinelifestyle@gmail.com
              </a>
            </p>
            <p><span className="font-semibold text-gray-900">Business Hours:</span> Mon–Sat | 10 AM – 6 PM IST</p>
          </div>
        </div>

        <div className="mt-10 text-left">
          <h2 className="text-lg font-semibold text-gray-900">Send us a message</h2>
          <p className="mt-1 text-sm text-gray-600">We’ll get back to you as soon as possible.</p>

          {status.type !== 'idle' && status.message ? (
            <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${status.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {status.message}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  value={form.name}
                  onChange={onChange('name')}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  value={form.email}
                  onChange={onChange('email')}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
                <input
                  value={form.phone}
                  onChange={onChange('phone')}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="Your phone number"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject (optional)</label>
                <input
                  value={form.subject}
                  onChange={onChange('subject')}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="Order issue, sizing, shipping…"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                value={form.message}
                onChange={onChange('message')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                rows={6}
                placeholder="Tell us how we can help…"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
