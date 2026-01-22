import { Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext'

// Mapping category tiles to newly added real images inside /products folder
const defaultTiles = [
  { name: 'FOOTWEAR', imageUrl: '/products/product4.jpg', href: '/category/FOOTWEAR' },
  { name: 'CLOTHING', imageUrl: '/products/product6.jpg', href: '/category/CLOTHING' },
  { name: 'BAGS', imageUrl: '/products/product2.jpg', href: '/category/BAGS' },
  { name: 'ACCESSORIES', imageUrl: '/products/product1.jpg', href: '/category/ACCESSORIES' },
]

export default function CategoriesSection() {
  const { content } = useContent()
  
  // Don't render if categories section is disabled
  if (!content.homepage.categories?.enabled) {
    return null
  }
  
  const categories = content.homepage.categories?.items || defaultTiles

  return (
    <section className="w-full px-0 sm:px-0 lg:px-0 py-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        {categories.map((category, index) => (
          <Link 
            to={category.href || `/category/${encodeURIComponent(category.name || 'unknown')}`} 
            key={category.name || index} 
            className="group relative block"
          >
            <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100">
              <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]" />
              {/* Bottom-center label without shadow */}
              <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-center">
                <span className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide uppercase">
                  {category.name}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
