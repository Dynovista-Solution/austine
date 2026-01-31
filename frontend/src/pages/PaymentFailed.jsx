import { Link, useSearchParams } from 'react-router-dom'
import { XCircleIcon } from '@heroicons/react/24/outline'

export default function PaymentFailed() {
  const [searchParams] = useSearchParams()
  const txnid = searchParams.get('txnid')

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <XCircleIcon className="w-20 h-20 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        
        <p className="text-gray-600 mb-2">
          We're sorry, but your payment could not be processed.
        </p>
        
        {txnid && (
          <p className="text-sm text-gray-500 mb-8">
            Transaction ID: <span className="font-mono">{txnid}</span>
          </p>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-yellow-900 mb-2">What happened?</h2>
          <ul className="text-sm text-yellow-800 text-left space-y-1">
            <li>• Payment was declined by your bank</li>
            <li>• Insufficient funds in your account</li>
            <li>• Transaction timeout or network issue</li>
            <li>• Payment cancelled by you</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/cart" 
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors"
          >
            Try Again
          </Link>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-900 text-sm font-semibold rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-600">
          Need help? <Link to="/contact" className="text-blue-600 hover:underline">Contact our support team</Link>
        </p>
      </div>
    </main>
  )
}
