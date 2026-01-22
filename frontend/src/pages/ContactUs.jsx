import { useEffect } from 'react'

export default function ContactUs() {
  useEffect(() => {
    document.title = 'Contact Us'
  }, [])

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Us</h1>

        <div className="mt-6 text-sm text-gray-700 leading-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">CONTACT DETAILS</p>
            <p><span className="font-semibold text-gray-900">Brand:</span> AustineLifestyle</p>
            <p>
              <span className="font-semibold text-gray-900">Email:</span>{' '}
              <a className="text-blue-600 hover:underline" href="mailto:info.austinelifestyle@gmail.com">
                info.austinelifestyle@gmail.com
              </a>
            </p>
            <p><span className="font-semibold text-gray-900">Business Hours:</span> Mon–Sat | 10 AM – 6 PM IST</p>
          </div>
        </div>
      </div>
    </div>
  )
}
