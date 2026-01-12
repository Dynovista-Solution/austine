import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function ImageUpload({ label, value, onChange, help, accept = "image/*", maxSize = 5 }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (maxSize in MB)
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        onChange(dataUrl)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('Failed to read file')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to upload image')
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Current Image Display */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="w-24 h-24 object-contain bg-white rounded border border-gray-300"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhotoIcon className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
        </button>

        {/* URL Input as Alternative */}
        <div className="flex-1">
          <input
            type="url"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or enter image URL"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Help Text */}
      {help && (
        <p className="text-sm text-gray-500">{help}</p>
      )}
    </div>
  )
}