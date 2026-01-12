import { useEffect } from 'react'

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy'
  }, [])

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>

        <div className="mt-6 space-y-6 text-sm text-gray-700 leading-6">
          <p>
            At AustineLifestyle, your privacy and trust are important to us. This policy explains how we collect,
            use, and protect your personal information.
          </p>

          <div>
            <h2 className="text-base font-bold text-gray-900">Information We Collect</h2>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>Name, contact details, and address</li>
              <li>Order and purchase history</li>
              <li>Device, IP, browser, and usage data</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">Use of Information</h2>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>Order processing and delivery</li>
              <li>Customer support and communication</li>
              <li>Returns, exchanges, and refunds</li>
              <li>Marketing (only if opted-in)</li>
              <li>Website improvement</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">Data Security</h2>
            <p className="mt-3">
              All payments are processed via secure, encrypted gateways. We do not store card or banking details.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">Third-Party Sharing</h2>
            <p className="mt-3">
              Information is shared only with logistics and payment partners for order fulfillment.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">Policy Updates</h2>
            <p className="mt-3">
              We may update this policy at any time. Continued use implies acceptance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
