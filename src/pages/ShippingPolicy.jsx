import { useEffect } from 'react'

export default function ShippingPolicy() {
  useEffect(() => {
    document.title = 'Shipping Policy'
  }, [])

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shipping Policy</h1>

        <div className="mt-6 text-sm text-gray-700 leading-6">
          <p className="font-semibold text-gray-900">SHIPPING POLICY</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <span className="font-semibold text-gray-900">Order Processing:</span> 1–3 business days
            </li>
            <li>
              <span className="font-semibold text-gray-900">Delivery Timeline:</span> 5–10 business days depending on location and courier
            </li>
            <li>
              <span className="font-semibold text-gray-900">Shipping Charges:</span> Displayed at checkout and subject to change
            </li>
            <li>
              <span className="font-semibold text-gray-900">Address Accuracy:</span> Incorrect details may lead to failed delivery without refund
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
