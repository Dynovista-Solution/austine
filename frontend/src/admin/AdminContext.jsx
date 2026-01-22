import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import apiService from '../services/api'
// Removed hardcoded initialProducts; products now always come from API

const AdminContext = createContext(null)

let hasInitializedAdmin = false

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('adminSession:v1') === '1' && localStorage.getItem('authToken') !== null
  })
  const [products, setProducts] = useState([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 })
  const [content, setContent] = useState(() => {
    // Temporarily bypass localStorage to ensure default data is used
    return {
      homepage: {
        topBanner: {
          text: 'Friends & Family: Enjoy 25% off Fall-Winter & Sale styles. *Exclusions apply. Sale items online only.',
          buttonText: 'SHOP NOW',
          buttonLink: '/products',
          enabled: true
        },
        hero: {
          title: 'Welcome to AUSTINE',
          subtitle: 'Discover luxury fashion & lifestyle',
          imageUrl: '/hero-image.jpg',
          primaryButton: {
            text: 'Shop Now',
            link: '/products'
          },
          secondaryButton: {
            text: 'Learn More',
            link: '/about'
          }
        },
        footerBanner: {
          messages: [
            'Free Shipping Over 1500Rs.',
            'Easy 30-Day Returns',
            'Join & Get 10% Off Your First Order'
          ],
          enabled: true
        },
        categories: {
          enabled: true,
          items: [
            { name: 'FOOTWEAR', imageUrl: '/products/product4.jpg', href: '/category/FOOTWEAR' },
            { name: 'CLOTHING', imageUrl: '/products/product6.jpg', href: '/category/CLOTHING' },
            { name: 'BAGS', imageUrl: '/products/product2.jpg', href: '/category/BAGS' },
            { name: 'ACCESSORIES', imageUrl: '/products/product1.jpg', href: '/category/ACCESSORIES' }
          ]
        },
        header: {
          navigation: [
            {
              name: 'FOOTWEAR',
              subcategories: ['FLATS', 'HEELS', 'BALLERINA', 'BOOTS', 'SNEAKERS'],
              imageUrl: '/products/product4.jpg',
              link: '/category/FOOTWEAR'
            },
            {
              name: 'CLOTHING',
              subcategories: ['DRESSES', 'TOPS', 'BOTTOM WEAR'],
              imageUrl: '/products/product6.jpg',
              link: '/category/CLOTHING'
            },
            {
              name: 'BAGS',
              subcategories: ['HAND BAG', 'SHOULDER BAG', 'TOTE BAG', 'WALLETS'],
              imageUrl: '/products/product2.jpg',
              link: '/category/BAGS'
            },
            {
              name: 'NEW ARRIVALS',
              subcategories: [],
              imageUrl: '/products/product1.jpg',
              link: '/category/NEW%20ARRIVALS'
            },
            {
              name: 'HOT DEALS',
              subcategories: [],
              imageUrl: '/products/product11.jpg',
              link: '/category/HOT%20DEALS'
            },
            {
              name: 'COMBINATION DEAL',
              subcategories: ['ACCESSORIES + DRESS + FOOTWEAR + BAGS'],
              imageUrl: '/products/product5.jpg',
              link: '/category/COMBINATION%20DEAL'
            }
          ]
        },
        productSections: [
          { id: 'best-sellers', title: 'Best Sellers', enabled: true, productIds: [] },
          { id: 'recommended', title: 'Recommended Products', enabled: true, productIds: [] },
          { id: 'most-viewed', title: 'Most Viewed', enabled: true, productIds: [] }
        ]
      },
      branding: {
        siteName: 'AUSTINE',
        siteDescription: 'Luxury Fashion & Lifestyle',
        logoUrl: '/logo.jpg',
        faviconUrl: '/favicon.ico'
      },
      socialMedia: [
        { platform: 'Facebook', url: 'https://facebook.com/austine', icon: 'GlobeAltIcon', enabled: true },
        { platform: 'Instagram', url: 'https://instagram.com/austine', icon: 'GlobeAltIcon', enabled: true },
        { platform: 'X', url: 'https://x.com/austine', icon: 'GlobeAltIcon', enabled: true },
        { platform: 'TikTok', url: 'https://tiktok.com/@austine', icon: 'GlobeAltIcon', enabled: true },
        { platform: 'Pinterest', url: 'https://pinterest.com/austine', icon: 'GlobeAltIcon', enabled: true },
        { platform: 'YouTube', url: '', handle: 'AustineFashion', icon: 'GlobeAltIcon', enabled: true }
      ]
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (hasInitializedAdmin) return
    hasInitializedAdmin = true
    
    if (isAdminLoggedIn) {
      // Load admin profile and data when logged in
      loadAdminData()
    } else {
      setAdmin(null)
      setProducts([])
    }
  }, [isAdminLoggedIn])

  // Save content to localStorage whenever content changes
  useEffect(() => {
    localStorage.setItem('adminContent:v1', JSON.stringify(content))
    // Also save social media separately for easy access
    localStorage.setItem('socialMedia:v1', JSON.stringify(content.socialMedia || []))
  }, [content])

  // Load admin data from API
  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get admin profile
      const profileResponse = await apiService.getProfile()
      if (profileResponse.success) {
        // API returns { success, data: { user } }
        const user = profileResponse.data?.user || profileResponse.data
        if (user?.role !== 'admin' && user?.role !== 'super_admin') {
          throw new Error('Admin access required.')
        }
        setAdmin(user)
      }

      // Get products
      const productsResponse = await apiService.getProducts({ page: 1, limit: 500, includeInactive: true })
      if (productsResponse.success) {
        // Backend returns { data: { products, pagination } } in most endpoints
        // Fall back to data as array when mocked
        const arr = productsResponse.data?.products || productsResponse.data || []
        const pagination = productsResponse.data?.pagination
        setProducts(Array.isArray(arr) ? arr : [])
        if (pagination) {
          setProductsPagination({
            page: pagination.page || 1,
            pages: pagination.pages || 1,
            total: pagination.total ?? (Array.isArray(arr) ? arr.length : 0),
            limit: pagination.limit || 20
          })
        } else {
          setProductsPagination({ page: 1, pages: 1, total: Array.isArray(arr) ? arr.length : 0, limit: Array.isArray(arr) ? arr.length : 20 })
        }
      }

      // Get content (if there's a content API endpoint)
      try {
        const contentResponse = await apiService.getAllContent()
        if (contentResponse.success && contentResponse.data.contents) {
          // Convert array of content objects to the expected structure
          const contentMap = {}
          const reverseTypeMapping = {
            'social_media': 'socialMedia',
            'homepage': 'homepage',
            'branding': 'branding'
          }
          
          contentResponse.data.contents.forEach(item => {
            // Map API type back to our internal type
            const internalType = reverseTypeMapping[item.type] || item.type
            // Set the section to its data payload directly, ensuring arrays are arrays
            let data = item.data
            if (internalType === 'socialMedia') {
              // For social media, extract the array from the socialMedia property
              data = data.socialMedia || []
            } else if (!Array.isArray(data) && typeof data !== 'object') {
              data = []
            }
            contentMap[internalType] = data
          })
          setContent(prev => ({ ...prev, ...contentMap }))
        }
      } catch (contentError) {
        // Content API might not exist yet, use localStorage fallback
        console.log('Content API not available, using localStorage')
      }

    } catch (error) {
      console.error('Failed to load admin data:', error)
      setError(error.message)
      // If token is invalid, logout
      adminLogout()
    } finally {
      setLoading(false)
    }
  }

  async function adminLogin(email, password) {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.adminLogin(email, password)

      if (response.success) {
        setAdmin(response.data.user)
        setIsAdminLoggedIn(true)
        // Load admin data after successful login
        await loadAdminData()
        return response.data.user
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  function adminLogout() {
    setAdmin(null)
    setIsAdminLoggedIn(false)
    setProducts([])
    setError(null)
    apiService.adminLogout()
  }

  // Check if admin has permission
  function hasPermission(permission) {
    if (!admin) return false
    const perms = Array.isArray(admin.permissions) ? admin.permissions : []
    if (admin.role === 'super_admin' || perms.includes('all')) return true
    return perms.includes(permission)
  }

  // Product management functions
  const addProduct = useCallback(async (productData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.createProduct(productData)
      if (response.success) {
        const newProduct = response.data?.product || response.data
        setProducts(prev => [...prev, newProduct])
        return newProduct
      } else {
        throw new Error(response.message || 'Failed to add product')
      }
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProduct = useCallback(async (id, productData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.updateProduct(id, productData)
      if (response.success) {
        const updated = response.data?.product || response.data
        const idStr = String(id)
        setProducts(prev => prev.map(product => {
          const pid = String(product.id || product._id)
          return pid === idStr ? updated : product
        }))
        return updated
      } else {
        throw new Error(response.message || 'Failed to update product')
      }
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.getProducts({ page: 1, limit: 500, includeInactive: true, ...params })
      if (response.success) {
        const arr = response.data?.products || response.data || []
        const pagination = response.data?.pagination
        setProducts(Array.isArray(arr) ? arr : [])
        if (pagination) {
          setProductsPagination({
            page: pagination.page || 1,
            pages: pagination.pages || 1,
            total: pagination.total ?? (Array.isArray(arr) ? arr.length : 0),
            limit: pagination.limit || 20
          })
        } else {
          setProductsPagination({ page: 1, pages: 1, total: Array.isArray(arr) ? arr.length : 0, limit: Array.isArray(arr) ? arr.length : 20 })
        }
        return { products: Array.isArray(arr) ? arr : [], pagination: response.data?.pagination || null }
      } else {
        throw new Error(response.message || 'Failed to load products')
      }
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProduct = useCallback(async (id, reloadParams = undefined) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.deleteProduct(id)
      if (response.success) {
        // Reload products from server to get accurate list (excluding soft-deleted)
        await loadProducts(reloadParams || undefined)
        return true
      } else {
        throw new Error(response.message || 'Failed to delete product')
      }
    } catch (error) {
      // If backend reports not found, still remove local (legacy dummy seed)
      if (/not\s*found/i.test(error.message)) {
        const idStr = String(id)
        setProducts(prev => prev.filter(product => String(product.id || product._id) !== idStr))
        return true
      }
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [loadProducts])

  function getProductById(id) {
    const idStr = String(id)
    return products.find(p => String(p.id) === idStr || String(p._id) === idStr)
  }

  // Content management functions
  function updateContent(section, field, value) {
    // Update local state immediately for UI responsiveness
    setContent(prevContent => {
      const newContent = JSON.parse(JSON.stringify(prevContent)) // Deep clone to avoid mutation
      
      if (section === 'socialMedia') {
        // Direct array replacement - ensure it's a new array reference
        const arrayValue = Array.isArray(value) ? value : []
        newContent.socialMedia = [...arrayValue]
        return { ...newContent }
      } else if (field && field.includes('.')) {
        // Nested field update like 'hero.title'
        const keys = field.split('.')
        let current = newContent[section]
        
        // Navigate to the nested property
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {}
          current = current[keys[i]]
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value
      } else if (field) {
        // Direct field update
        if (!newContent[section]) newContent[section] = {}
        newContent[section][field] = value
      } else {
        // Section update
        newContent[section] = { ...newContent[section], ...value }
      }
      
      return { ...newContent }
    })
  }

  async function saveAllContent() {
    try {
      setLoading(true)
      setError(null)

      // Map section names to API content types
      const typeMapping = {
        socialMedia: 'social_media',
        homepage: 'homepage',
        branding: 'branding'
      }

      // Save each content section sequentially with delays to avoid rate limiting
      const results = []
      for (const [section, data] of Object.entries(content)) {
        const apiType = typeMapping[section] || section
        
        // Format data for API
        let apiData = data
        if (section === 'socialMedia') {
          apiData = { socialMedia: data }
        }

        try {
          await apiService.updateContent(apiType, apiData)
          results.push({ success: true, section })
        } catch (err) {
          console.error(`Failed to save ${section}:`, err)
          results.push({ success: false, section })
        }

        // Add a delay between requests to avoid rate limiting
        if (Object.keys(content).indexOf(section) < Object.keys(content).length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
        }
      }

      const failures = results.filter(r => r.success === false)

      if (failures.length > 0) {
        throw new Error(`Failed to save some content sections: ${failures.map(f => f.section).join(', ')}`)
      }

      return { success: true, message: 'All content saved successfully!' }
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminContext.Provider value={{
      admin,
      isAdminLoggedIn,
      adminLogin,
      adminLogout,
      hasPermission,
      products,
      productsPagination,
      loadProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      content,
      updateContent,
      saveAllContent,
      loading,
      error
    }}>
      {children}
    </AdminContext.Provider>
  )
}

// Custom hook for accessing admin context
function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}

export { useAdmin }