import { createContext, useContext, useState, useEffect, useRef } from 'react'
import apiService from '../services/api'

const ContentContext = createContext(null)

let hasInitializedContent = false

export function ContentProvider({ children }) {
  const [content, setContent] = useState({
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
  })
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (hasInitializedContent) return
    hasInitializedContent = true
    
    // Start with loading from API, fallback to localStorage
    loadContent()
  }, [])

  async function loadContent() {
    try {
      setLoading(true)
      const response = await apiService.getAllContent()
      
      if (response.success && response.data.contents) {
        // Convert array of content objects to the expected structure
        const contentMap = {}
        response.data.contents.forEach(item => {
          contentMap[item.type] = item.data
        })
        
        // Use API data as primary source
        setContent(prev => ({
          homepage: contentMap.homepage || prev.homepage,
          branding: { ...prev.branding, ...contentMap.branding },
          socialMedia: contentMap.social_media?.socialMedia || prev.socialMedia
        }))
      } else {
        // API returned success but no data, try localStorage fallback
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Failed to load content from API, using localStorage fallback:', error)
      // API failed, use localStorage fallback
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  function loadFromLocalStorage() {
    const savedSocialMedia = localStorage.getItem('socialMedia:v1')
    const savedAdminContent = localStorage.getItem('adminContent:v1')
    
    setContent(prev => {
      let newContent = { ...prev }
      
      if (savedSocialMedia) {
        try {
          newContent.socialMedia = JSON.parse(savedSocialMedia)
        } catch (error) {
          console.error('Failed to parse saved social media:', error)
        }
      }
      
      if (savedAdminContent) {
        try {
          const adminContent = JSON.parse(savedAdminContent)
          if (adminContent.homepage) {
            newContent.homepage = adminContent.homepage
          }
        } catch (error) {
          console.error('Failed to parse saved admin content:', error)
        }
      }
      
      return newContent
    })
  }

  // Refresh content (can be called after admin makes changes)
  async function refreshContent() {
    // Reload from API after admin saves changes
    await loadContent()
  }

  return (
    <ContentContext.Provider value={{ content, loading, refreshContent }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
