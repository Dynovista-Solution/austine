import { useEffect } from 'react'

export default function RefundExchangePolicy() {
  useEffect(() => {
    document.title = 'Refund & Exchange Policy'
  }, [])

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Refund &amp; Exchange Policy</h1>

        <div className="mt-6 text-sm text-gray-700 leading-6">
          <p className="font-semibold text-gray-900">REFUND &amp; EXCHANGE POLICY</p>

          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-gray-900">7-Day Return &amp; Exchange</p>
              <p className="mt-1">Requests must be raised within 7 days of delivery.</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Eligibility</p>
              <ul className="mt-2 space-y-2 list-disc list-inside">
                <li>Unused, unworn, unwashed</li>
                <li>Original tags and packaging intact</li>
                <li>Proof of purchase required</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Non-Returnable Items</p>
              <ul className="mt-2 space-y-2 list-disc list-inside">
                <li>Sale or discounted items</li>
                <li>Accessories</li>
                <li>Customized or made-to-order products</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Refunds</p>
              <ul className="mt-2 space-y-2 list-disc list-inside">
                <li>Processed after quality check</li>
                <li>Shipping charges are non-refundable</li>
                <li>Refunds via original method or store credit</li>
                <li>7–10 business days processing</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Exchanges</p>
              <ul className="mt-2 space-y-2 list-disc list-inside">
                <li>One exchange per order</li>
                <li>Subject to availability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
