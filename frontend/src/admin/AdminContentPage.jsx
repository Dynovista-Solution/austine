import { useState, useEffect } from 'react'
import { useAdmin } from './AdminContext.jsx'
import { useContent } from '../context/ContentContext.jsx'
import apiService from '../services/api'
import {
  PhotoIcon,
  LinkIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

// ContentField component defined outside to prevent recreation on every render
const ContentField = ({ label, value, onChange, type = 'text', placeholder, help }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )}
    {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
  </div>
)

export default function AdminContentPage() {
  const { isAdminLoggedIn, content, updateContent, saveAllContent, loading, products } = useAdmin()
  const { refreshContent } = useContent()
  const [activeTab, setActiveTab] = useState('homepage')
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [availableCategories, setAvailableCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Load available categories on component mount
  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true)
      try {
        const response = await apiService.getCategories()
        if (response.success && response.data.categories) {
          setAvailableCategories(response.data.categories)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  // Ensure content has all required nested properties to avoid errors
  // Note: We now use content directly with null checks instead of safeContent wrapper

  const tabs = [
    { id: 'homepage', name: 'Homepage', icon: DocumentTextIcon },
    { id: 'social', name: 'Social Media', icon: LinkIcon }
  ]

  const handleContentUpdate = (section, field, value) => {
    updateContent(section, field, value)
  }

  const handleSocialMediaUpdate = (index, field, value) => {
    const currentSocial = content.socialMedia || []
    const updatedSocial = [...currentSocial]
    updatedSocial[index] = { ...updatedSocial[index], [field]: value }
    updateContent('socialMedia', null, updatedSocial)
  }

  const LOCKED_PRODUCT_SECTIONS = [
    { id: 'best-sellers', title: 'Best Sellers' },
    { id: 'recommended', title: 'Recommended Products' },
    { id: 'most-viewed', title: 'Most Viewed' }
  ]

  const homepageProductSections = Array.isArray(content.homepage?.productSections)
    ? content.homepage.productSections
    : []

  const lockedHomepageSections = LOCKED_PRODUCT_SECTIONS.map(def => {
    const existing = homepageProductSections.find(s => String(s?.id || '') === def.id)
    return {
      id: def.id,
      title: def.title,
      enabled: existing?.enabled !== false,
      productIds: Array.isArray(existing?.productIds) ? existing.productIds.map(String) : []
    }
  })

  const updateProductSections = (nextSections) => {
    handleContentUpdate('homepage', 'productSections', Array.isArray(nextSections) ? nextSections : [])
  }

  const updateLockedSection = (sectionId, patchFn) => {
    const next = lockedHomepageSections.map(sec => {
      if (sec.id !== sectionId) return sec
      const patched = typeof patchFn === 'function' ? patchFn(sec) : sec
      const productIds = Array.isArray(patched.productIds) ? patched.productIds.map(String) : []
      // Keep unique, preserve order
      const seen = new Set()
      const uniq = productIds.filter(id => {
        const s = String(id)
        if (seen.has(s)) return false
        seen.add(s)
        return true
      })
      return { ...sec, enabled: patched.enabled !== false, productIds: uniq }
    })
    updateProductSections(next)
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Content Management</h1>
        <p className="text-gray-600 mt-1">Control all aspects of your website content without needing a developer.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="space-y-6">
            {activeTab === 'homepage' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Homepage Content</h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Top Banner</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="topBannerEnabled"
                          checked={content.homepage?.topBanner?.enabled || false}
                          onChange={(e) => handleContentUpdate('homepage', 'topBanner.enabled', e.target.checked)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <label htmlFor="topBannerEnabled" className="text-sm font-medium text-gray-700">
                          Enable Top Banner
                        </label>
                      </div>
                      
                      <ContentField
                        label="Banner Text"
                        value={(content.homepage?.topBanner?.text) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'topBanner.text', value)}
                        placeholder="Friends & Family: Enjoy 25% off Fall-Winter & Sale styles. *Exclusions apply."
                        help="The promotional text displayed in the top banner"
                      />
                      
                      <ContentField
                        label="Button Text"
                        value={(content.homepage?.topBanner?.buttonText) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'topBanner.buttonText', value)}
                        placeholder="SHOP NOW"
                        help="Text for the call-to-action button (leave empty to hide button)"
                      />
                      
                      <ContentField
                        label="Button Link"
                        value={(content.homepage?.topBanner?.buttonLink) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'topBanner.buttonLink', value)}
                        placeholder="/products"
                        help="URL where the button should link to"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Hero Section</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <ContentField
                        label="Main Headline"
                        value={(content.homepage?.hero?.title) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'hero.title', value)}
                        placeholder="Welcome to Austine Lifestyle LLP"
                        help="The main headline displayed on your homepage"
                      />
                      <ContentField
                        label="Subtitle"
                        value={(content.homepage?.hero?.subtitle) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'hero.subtitle', value)}
                        placeholder="Discover luxury fashion & lifestyle"
                        help="The subtitle under the main headline"
                      />
                      
                      {/* Hero Image Upload */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hero Image
                        </label>
                        <div className="flex items-center space-x-4">
                          {content.homepage?.hero?.imageUrl && (
                            <img 
                              src={content.homepage.hero.imageUrl} 
                              alt="Hero preview" 
                              className="w-20 h-20 object-cover rounded border"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0]
                              if (file) {
                                try {
                                  const response = await apiService.uploadImage(file)
                                  if (response.success) {
                                    handleContentUpdate('homepage', 'hero.imageUrl', response.data.url)
                                    // Refresh content context to show the new image immediately
                                    await refreshContent()
                                  } else {
                                    alert('Failed to upload image')
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error)
                                  alert('Failed to upload image')
                                }
                              }
                            }}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload a hero image for your homepage (recommended size: 1920x1080)</p>
                      </div>
                      
                      <ContentField
                        label="Primary Button Text"
                        value={(content.homepage?.hero?.primaryButton?.text) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'hero.primaryButton.text', value)}
                        placeholder="Shop Now"
                        help="Text for the main call-to-action button"
                      />
                      <ContentField
                        label="Primary Button Link"
                        value={(content.homepage?.hero?.primaryButton?.link) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'hero.primaryButton.link', value)}
                        placeholder="/products"
                        help="URL where the button should link to"
                      />
                      <ContentField
                        label="Secondary Button Text"
                        value={(content.homepage?.hero?.secondaryButton?.text) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'hero.secondaryButton.text', value)}
                        placeholder="Learn More"
                        help="Text for the secondary button (leave empty to hide)"
                      />
                      <ContentField
                        label="Secondary Button Link"
                        value={(content.homepage?.hero?.secondaryButton?.link) || ''}
                        onChange={(value) => handleContentUpdate('homepage', 'hero.secondaryButton.link', value)}
                        placeholder="/about"
                        help="URL for the secondary button"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Product Sections</h4>
                    <p className="text-sm text-gray-600 mb-4">Configure homepage rows like Best Sellers, Recommended, Most Viewed. Homepage shows 4 items; “View More” shows all products you add here.</p>

                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="text-sm text-gray-700">Sections ({lockedHomepageSections.length})</div>

                      <div className="space-y-4">
                        {lockedHomepageSections.map((sec) => {
                          const sectionId = String(sec?.id || '')
                          const sectionTitle = String(sec?.title || '')
                          const enabled = sec?.enabled !== false
                          const productIds = Array.isArray(sec?.productIds) ? sec.productIds.map(String) : []

                          return (
                            <div key={sectionId} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(e) => {
                                      updateLockedSection(sectionId, (cur) => ({ ...cur, enabled: e.target.checked }))
                                    }}
                                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                  />
                                  <div className="text-sm font-medium text-gray-900">{sectionTitle}</div>
                                </div>

                                <div className="text-xs text-gray-500">ID: {sectionId}</div>
                              </div>

                                <div className="mt-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Add product</label>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const pid = e.target.value
                                        if (!pid) return
                                        updateLockedSection(sectionId, (cur) => {
                                          const current = Array.isArray(cur.productIds) ? cur.productIds.map(String) : []
                                          if (current.includes(pid)) return cur
                                          return { ...cur, productIds: [...current, pid] }
                                        })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                      <option value="">Select a product…</option>
                                      {(products || []).map(p => {
                                        const pid = String(p._id || p.id)
                                        return (
                                          <option key={pid} value={pid}>
                                            {p.name} ({pid.slice(-6)})
                                          </option>
                                        )
                                      })}
                                    </select>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Tip: the order here is the order shown on View More.</p>
                                </div>

                                <div className="mt-3">
                                  <div className="text-sm font-medium text-gray-800 mb-2">Selected products ({productIds.length})</div>
                                  {productIds.length === 0 ? (
                                    <div className="text-sm text-gray-600">No products added.</div>
                                  ) : (
                                    <div className="space-y-2">
                                      {productIds.map((pid, pIndex) => {
                                        const prod = (products || []).find(p => String(p._id || p.id) === String(pid))
                                        return (
                                          <div key={pid} className="flex items-center justify-between gap-2 border border-gray-100 rounded px-3 py-2">
                                            <div className="text-sm text-gray-800 truncate">
                                              {prod?.name || 'Unknown product'}
                                              <span className="text-xs text-gray-500"> {' '}(ID: {String(pid).slice(-8)})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                disabled={pIndex === 0}
                                                onClick={() => {
                                                  updateLockedSection(sectionId, (cur) => {
                                                    const list = Array.isArray(cur.productIds) ? cur.productIds.map(String) : []
                                                    const swapped = [...list]
                                                    const tmp = swapped[pIndex - 1]
                                                    swapped[pIndex - 1] = swapped[pIndex]
                                                    swapped[pIndex] = tmp
                                                    return { ...cur, productIds: swapped }
                                                  })
                                                }}
                                                className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                                              >
                                                Up
                                              </button>
                                              <button
                                                type="button"
                                                disabled={pIndex === productIds.length - 1}
                                                onClick={() => {
                                                  updateLockedSection(sectionId, (cur) => {
                                                    const list = Array.isArray(cur.productIds) ? cur.productIds.map(String) : []
                                                    const swapped = [...list]
                                                    const tmp = swapped[pIndex + 1]
                                                    swapped[pIndex + 1] = swapped[pIndex]
                                                    swapped[pIndex] = tmp
                                                    return { ...cur, productIds: swapped }
                                                  })
                                                }}
                                                className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                                              >
                                                Down
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updateLockedSection(sectionId, (cur) => {
                                                    const list = Array.isArray(cur.productIds) ? cur.productIds.map(String) : []
                                                    return { ...cur, productIds: list.filter(x => String(x) !== String(pid)) }
                                                  })
                                                }}
                                                className="px-2 py-1 text-xs border rounded"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Footer Banner Messages</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="footerBannerEnabled"
                          checked={content.homepage?.footerBanner?.enabled || false}
                          onChange={(e) => handleContentUpdate('homepage', 'footerBanner.enabled', e.target.checked)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <label htmlFor="footerBannerEnabled" className="text-sm font-medium text-gray-700">
                          Enable Footer Banner
                        </label>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rotating Messages (shown one at a time)
                        </label>
                        {(content.homepage?.footerBanner?.messages || []).map((message, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                            <input
                              type="text"
                              value={message}
                              onChange={(e) => {
                                const newMessages = [...(content.homepage?.footerBanner?.messages || [])]
                                newMessages[index] = e.target.value
                                handleContentUpdate('homepage', 'footerBanner.messages', newMessages)
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
                              placeholder={`Message ${index + 1}`}
                            />
                            <button
                              onClick={() => {
                                const newMessages = (content.homepage?.footerBanner?.messages || []).filter((_, i) => i !== index)
                                handleContentUpdate('homepage', 'footerBanner.messages', newMessages)
                              }}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Remove message"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            const newMessages = [...(content.homepage?.footerBanner?.messages || []), '']
                            handleContentUpdate('homepage', 'footerBanner.messages', newMessages)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Message
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Messages rotate every 3 seconds. Leave enabled unchecked to hide the footer banner.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Categories Section</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="categoriesEnabled"
                          checked={content.homepage?.categories?.enabled || false}
                          onChange={(e) => handleContentUpdate('homepage', 'categories.enabled', e.target.checked)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <label htmlFor="categoriesEnabled" className="text-sm font-medium text-gray-700">
                          Enable Categories Section
                        </label>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category Tiles
                        </label>
                        {(content.homepage?.categories?.items || []).map((category, index) => (
                          <div key={index} className="border border-gray-200 rounded-md p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Category {index + 1}</span>
                              <button
                                onClick={() => {
                                  const newItems = (content.homepage?.categories?.items || []).filter((_, i) => i !== index)
                                  handleContentUpdate('homepage', 'categories.items', newItems)
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Remove category"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={category.name || ''}
                                    onChange={(e) => {
                                      const newName = e.target.value
                                      const newItems = [...(content.homepage?.categories?.items || [])]
                                      newItems[index] = { 
                                        ...newItems[index], 
                                        name: newName,
                                        href: `/category/${encodeURIComponent(newName)}` // URL-encode the category name
                                      }
                                      handleContentUpdate('homepage', 'categories.items', newItems)
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="e.g., FOOTWEAR"
                                  />
                                  {availableCategories.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                      {availableCategories
                                        .filter(cat => 
                                          cat.name.toLowerCase().includes((category.name || '').toLowerCase()) &&
                                          cat.name.toLowerCase() !== (category.name || '').toLowerCase()
                                        )
                                        .slice(0, 5)
                                        .map(cat => (
                                          <button
                                            key={cat.name}
                                            onClick={() => {
                                              const newItems = [...(content.homepage?.categories?.items || [])]
                                              newItems[index] = { ...newItems[index], name: cat.name }
                                              handleContentUpdate('homepage', 'categories.items', newItems)
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                          >
                                            {cat.name}
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Available categories: {availableCategories.map(cat => cat.name).join(', ')}
                                </p>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={category.imageUrl || ''}
                                    onChange={(e) => {
                                      const newItems = [...(content.homepage?.categories?.items || [])]
                                      newItems[index] = { ...newItems[index], imageUrl: e.target.value }
                                      handleContentUpdate('homepage', 'categories.items', newItems)
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="e.g., /products/image.jpg"
                                  />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files[0]
                                      if (file) {
                                        try {
                                          const response = await apiService.uploadImage(file)
                                          if (response.success) {
                                            const newItems = [...(content.homepage?.categories?.items || [])]
                                            newItems[index] = { ...newItems[index], imageUrl: response.data.url }
                                            handleContentUpdate('homepage', 'categories.items', newItems)
                                          } else {
                                            alert('Failed to upload image')
                                          }
                                        } catch (error) {
                                          console.error('Upload error:', error)
                                          alert('Failed to upload image')
                                        }
                                      }
                                    }}
                                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                                <input
                                  type="text"
                                  value={category.href || ''}
                                  onChange={(e) => {
                                    const newItems = [...(content.homepage?.categories?.items || [])]
                                    newItems[index] = { ...newItems[index], href: e.target.value }
                                    handleContentUpdate('homepage', 'categories.items', newItems)
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="e.g., /category/FOOTWEAR"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Auto-generated from category name. Edit if you need a custom link.
                                </p>
                              </div>
                            </div>
                            
                            {category.imageUrl && (
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Preview</label>
                                <img 
                                  src={category.imageUrl} 
                                  alt={category.name} 
                                  className="w-16 h-20 object-cover border border-gray-200 rounded"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            const newItems = [...(content.homepage?.categories?.items || []), { name: '', imageUrl: '', href: '/category/' }]
                            handleContentUpdate('homepage', 'categories.items', newItems)
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Category
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Categories are displayed in a 2x2 grid on mobile and 4x1 grid on desktop. Use high-quality images (recommended: 400x600px). 
                        Category names should match existing product categories for the links to work properly. 
                        Available categories are shown below the name field.
                      </p>
                    </div>
                  </div>

                  {/* Header Navigation Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Header Navigation</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Navigation Menu Items
                        </label>
                        {(content.homepage?.header?.navigation || []).map((navItem, index) => (
                          <div key={index} className="border border-gray-200 rounded-md p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Menu Item {index + 1}</span>
                              <button
                                onClick={() => {
                                  const newItems = (content.homepage?.header?.navigation || []).filter((_, i) => i !== index)
                                  handleContentUpdate('homepage', 'header.navigation', newItems)
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Remove menu item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Menu Name</label>
                                <input
                                  type="text"
                                  value={navItem.name || ''}
                                  onChange={(e) => {
                                    const newName = e.target.value
                                    const newItems = [...(content.homepage?.header?.navigation || [])]
                                    newItems[index] = { 
                                      ...newItems[index], 
                                      name: newName,
                                      link: `/category/${encodeURIComponent(newName)}` // Auto-generate link from name
                                    }
                                    handleContentUpdate('homepage', 'header.navigation', newItems)
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="e.g., FOOTWEAR"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={navItem.imageUrl || ''}
                                    onChange={(e) => {
                                      const newItems = [...(content.homepage?.header?.navigation || [])]
                                      newItems[index] = { ...newItems[index], imageUrl: e.target.value }
                                      handleContentUpdate('homepage', 'header.navigation', newItems)
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="e.g., /products/image.jpg"
                                  />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files[0]
                                      if (file) {
                                        try {
                                          const response = await apiService.uploadImage(file)
                                          if (response.success) {
                                            const newItems = [...(content.homepage?.header?.navigation || [])]
                                            newItems[index] = { ...newItems[index], imageUrl: response.data.url }
                                            handleContentUpdate('homepage', 'header.navigation', newItems)
                                          } else {
                                            alert('Failed to upload image')
                                          }
                                        } catch (error) {
                                          console.error('Upload error:', error)
                                          alert('Failed to upload image')
                                        }
                                      }
                                    }}
                                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                                <input
                                  type="text"
                                  value={navItem.link || ''}
                                  onChange={(e) => {
                                    const newItems = [...(content.homepage?.header?.navigation || [])]
                                    newItems[index] = { ...newItems[index], link: e.target.value }
                                    handleContentUpdate('homepage', 'header.navigation', newItems)
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="e.g., /category/FOOTWEAR"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Auto-generated from name. Edit for custom link.
                                </p>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">Subcategories</label>
                              <div className="space-y-2">
                                {(navItem.subcategories || []).map((subcat, subIndex) => (
                                  <div key={subIndex} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={subcat}
                                      onChange={(e) => {
                                        const newSubcats = [...(navItem.subcategories || [])]
                                        newSubcats[subIndex] = e.target.value
                                        const newItems = [...(content.homepage?.header?.navigation || [])]
                                        newItems[index] = { ...newItems[index], subcategories: newSubcats }
                                        handleContentUpdate('homepage', 'header.navigation', newItems)
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="e.g., FLATS"
                                    />
                                    <button
                                      onClick={() => {
                                        const newSubcats = (navItem.subcategories || []).filter((_, i) => i !== subIndex)
                                        const newItems = [...(content.homepage?.header?.navigation || [])]
                                        newItems[index] = { ...newItems[index], subcategories: newSubcats }
                                        handleContentUpdate('homepage', 'header.navigation', newItems)
                                      }}
                                      className="p-1 text-red-600 hover:text-red-800"
                                      title="Remove subcategory"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newSubcats = [...(navItem.subcategories || []), '']
                                    const newItems = [...(content.homepage?.header?.navigation || [])]
                                    newItems[index] = { ...newItems[index], subcategories: newSubcats }
                                    handleContentUpdate('homepage', 'header.navigation', newItems)
                                  }}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add Subcategory
                                </button>
                              </div>
                            </div>

                            {navItem.imageUrl && (
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Preview</label>
                                <img
                                  src={navItem.imageUrl}
                                  alt={navItem.name}
                                  className="w-16 h-20 object-cover border border-gray-200 rounded"
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            const newItems = [...(content.homepage?.header?.navigation || []), { name: '', subcategories: [], imageUrl: '', link: '/category/' }]
                            handleContentUpdate('homepage', 'header.navigation', newItems)
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Menu Item
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Navigation items appear in the header menu with dropdown subcategories. Images are displayed in the mega menu and are clickable to navigate to category pages. Use high-quality images (recommended: 400x600px).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure your social media profiles. Only enabled platforms with URLs or handles will be displayed on the website.</p>
                </div>

                <div className="space-y-4">
                  {(content.socialMedia || []).map((social, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700">{social.platform}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {social.platform === 'YouTube' ? (
                          <>
                            <ContentField
                              label="Channel Handle"
                              value={social.handle || ''}
                              onChange={(value) => handleSocialMediaUpdate(index, 'handle', value)}
                              placeholder="YourChannelName"
                            />
                            <ContentField
                              label="Full URL (optional)"
                              value={social.url || ''}
                              onChange={(value) => handleSocialMediaUpdate(index, 'url', value)}
                              placeholder="https://youtube.com/@YourChannel"
                            />
                          </>
                        ) : (
                          <ContentField
                            label="URL"
                            value={social.url || ''}
                            onChange={(value) => handleSocialMediaUpdate(index, 'url', value)}
                            placeholder={`https://${social.platform.toLowerCase()}.com/yourpage`}
                          />
                        )}
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={social.enabled !== false}
                              onChange={(e) => handleSocialMediaUpdate(index, 'enabled', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Enabled</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {saveMessage && (
                <div className={`mb-4 p-3 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {saveMessage.text}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      setSaving(true)
                      setSaveMessage(null)
                      
                      // Save content to backend database
                      await saveAllContent()
                      
                      // Refresh the content context to show changes immediately
                      await refreshContent()
                      
                      setSaveMessage({ type: 'success', text: 'Content saved successfully! Changes are now live on your website.' })
                      setTimeout(() => setSaveMessage(null), 5000)
                    } catch (error) {
                      setSaveMessage({ type: 'error', text: error.message || 'Failed to save content' })
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving || loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}