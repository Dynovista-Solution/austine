import { useEffect } from 'react'

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = 'Terms and Conditions'
  }, [])

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms and Conditions</h1>
        <div className="mt-6 text-sm text-gray-700 leading-6">
          <p className="font-semibold text-gray-900">TERMS &amp; CONDITIONS</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>Product availability subject to change.</li>
            <li>Prices and descriptions may be updated.</li>
            <li>Slight color variation may occur.</li>
            <li>All content is intellectual property of AustineLifestyle.</li>
            <li>Governed by Indian law.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
