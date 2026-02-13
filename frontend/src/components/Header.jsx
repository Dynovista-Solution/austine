import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, MagnifyingGlassIcon, HeartIcon, UserIcon, ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useContent } from '../context/ContentContext.jsx'
import SearchDropdown from './SearchDropdown.jsx'
import { formatBrandName } from '../utils/brandName.js'

export default function Header() {
  const headerRef = useRef(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTopOffset, setSearchTopOffset] = useState(0)
  const [activeMegaCategory, setActiveMegaCategory] = useState(null)
  const [activeMegaTranslateX, setActiveMegaTranslateX] = useState(0)
  const { items } = useCart()
  const { ids: wishlistIds } = useWishlist()
  const { content } = useContent()

  const siteName = formatBrandName(content?.branding?.siteName)

  // Use dynamic navigation from content context
  const categories = content?.homepage?.header?.navigation || []
  const categoryImages = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.imageUrl
    return acc
  }, {})
  const totalQty = items.reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    if (!searchOpen) return
    try {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    } catch {
      return undefined
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const update = () => {
      const rect = headerRef.current?.getBoundingClientRect()
      const bottom = rect?.bottom ?? 0
      setSearchTopOffset(Math.max(0, Math.round(bottom)))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
    }
  }, [searchOpen])

  const openSearch = () => setSearchOpen(true)

  useEffect(() => {
    if (!activeMegaCategory) return

    const onPointerDown = () => {
      setActiveMegaCategory(null)
      setActiveMegaTranslateX(0)
    }

    // Close the mega menu on any click/tap anywhere.
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [activeMegaCategory])

  const closeMegaOnClick = () => {
    setActiveMegaCategory(null)
    setActiveMegaTranslateX(0)
  }

  const handleMegaEnter = (event, categoryName) => {
    setActiveMegaCategory(categoryName)

    try {
      const liEl = event.currentTarget
      const linkEl = liEl.querySelector('[data-nav-link]')
      const leftColEl = liEl.querySelector('[data-mega-left]')
      if (!linkEl || !leftColEl) return

      const linkRect = linkEl.getBoundingClientRect()
      const leftRect = leftColEl.getBoundingClientRect()

      // Align the left edge of submenu items under the left edge of the top menu label.
      // Subcategory links have px-3 (12px), so subtract that to align text.
      const desired = Math.round(linkRect.left - leftRect.left - 12)

      // Keep the list inside the left column (avoid overlapping the image column).
      const minListWidth = 240
      const maxTranslate = Math.max(0, Math.round(leftRect.width - minListWidth))
      const clamped = Math.min(Math.max(0, desired), maxTranslate)
      setActiveMegaTranslateX(clamped)
    } catch {
      // Ignore measurement errors (e.g., during resize)
    }
  }

  const handleMegaLeave = () => {
    setActiveMegaCategory(null)
    setActiveMegaTranslateX(0)
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-50" onMouseLeave={handleMegaLeave}>
      {/* Top promo bar */}
      {content.homepage.topBanner?.enabled && (
        <div className="w-full bg-black text-white text-xs md:text-sm py-2 text-center">
          <span>{content.homepage.topBanner.text}</span>
          {content.homepage.topBanner.buttonText && (
            <a
              href={content.homepage.topBanner.buttonLink || '#'}
              className="ml-2 font-semibold hover:underline underline-offset-4"
            >
              - {content.homepage.topBanner.buttonText}
            </a>
          )}
        </div>
      )}

      {/* Social media / utility bar */}
      <div className="w-full bg-gray-800 text-white py-2 text-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center gap-4">
            {/* Left: welcome text */}
            <div className="hidden sm:block tracking-wide">Welcome To {siteName}</div>
            <div className="sm:hidden tracking-wide">WELCOME</div>
            {/* Absolute centered track order link */}
            <a
              href="#"
              className="absolute left-1/2 -translate-x-1/2 text-xs sm:text-sm font-medium hover:underline underline-offset-4 hover:text-gray-300 transition-colors tracking-wide"
            >
              TRACK YOUR ORDER
            </a>
            {/* Right: social media icons */}
            <div className="ml-auto flex items-center gap-3">
              {content.socialMedia.filter(social => social.enabled && social.platform && social.url).map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  aria-label={social.platform}
                  className="p-1 hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.platform === 'Facebook' && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.5 9.5V7.75c0-.6.15-1.01 1.2-1.01H16V4h-2.1C11.68 4 10.5 5.1 10.5 7.3V9.5H9V12h1.5v8h3v-8h2l.5-2.5h-2.5Z"/>
                    </svg>
                  )}
                  {social.platform === 'Instagram' && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.25 2.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/>
                    </svg>
                  )}
                  {social.platform === 'Twitter' && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  {social.platform === 'X' && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                    </svg>
                  )}
                  {social.platform === 'TikTok' && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1Z"/>
                    </svg>
                  )}
                  {social.platform === 'Pinterest' && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.742-1.378l-.742 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.017.001z"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
  <div className="bg-white border-b border-gray-100 relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-16 lg:h-20 flex items-center">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link to="/" className="inline-flex items-center" aria-label="Home">
                <img
                  src={content?.branding?.logoUrl || '/logo.jpg'}
                  alt={siteName}
                  className="h-16 lg:h-20 object-contain"
                />
              </Link>
            </div>

            {/* Center: Navigation (hidden on mobile) */}
            <nav className="hidden lg:flex ml-8">
              <ul className="flex items-center gap-6 xl:gap-8">
                {categories.map((category) => (
                  <li
                    key={category.name}
                    className="group"
                    onMouseEnter={(e) => handleMegaEnter(e, category.name)}
                  >
                    <Link
                      data-nav-link
                      to={`/category/${encodeURIComponent(category.name)}`}
                      onClick={closeMegaOnClick}
                      className="text-xs font-medium text-gray-900 hover:text-black tracking-wide uppercase py-2 block"
                    >
                      {category.name}
                    </Link>
                    {/* Full-width mega menu */}
                    <div
                      className={
                        activeMegaCategory === category.name
                          ? 'opacity-100 visible transition-all duration-200'
                          : 'pointer-events-none opacity-0 invisible transition-all duration-200'
                      }
                    >
                      <div className="absolute left-0 right-0 top-full w-full z-50 overflow-x-hidden">
                        <div className="pointer-events-auto bg-white border-t border-gray-200 shadow-xl">
                          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-8">
                            {/* Left: subcategories (if any) */}
                            <div className="col-span-12 md:col-span-7 lg:col-span-8" data-mega-left>
                              {category.subcategories && category.subcategories.length > 0 ? (
                                <div
                                  className="flex flex-col transition-transform duration-200"
                                  style={
                                    activeMegaCategory === category.name
                                      ? { transform: `translateX(${activeMegaTranslateX}px)` }
                                      : undefined
                                  }
                                >
                                  {category.subcategories.map((subcategory) => (
                                    <Link
                                      key={subcategory}
                                      to={`/category/${encodeURIComponent(category.name)}?sub=${encodeURIComponent(subcategory)}`}
                                      onClick={closeMegaOnClick}
                                      className="block px-3 py-2 text-sm text-gray-800 no-underline"
                                      style={{ textDecoration: 'none' }}
                                    >
                                      <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[1px] after:w-full after:bg-current after:origin-left after:scale-x-0 after:transition-transform after:duration-500 after:ease-out hover:after:scale-x-100">
                                        {subcategory}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-4">
                                  <p className="text-sm text-gray-700">Explore {category.name}</p>
                                </div>
                              )}
                            </div>
                            {/* Right: image */}
                            <div className="hidden md:block col-span-12 md:col-span-5 lg:col-span-4">
                              <Link
                                to={category.link || `/category/${encodeURIComponent(category.name)}`}
                                className="block"
                                onClick={closeMegaOnClick}
                              >
                                <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 cursor-pointer">
                                  <img
                                    src={category.imageUrl || '/hero.jpg'}
                                    alt={category.name}
                                    className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right: Utilities */}
            <div className="flex items-center gap-4 lg:gap-6 ml-auto">
              {/* Lookbook navigation button */}
              <Link
                to="/lookbook"
                className="hidden md:inline-flex items-center text-xs font-medium text-gray-900 hover:underline"
              >
                Lookbook
              </Link>
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={openSearch}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openSearch()
                    }}
                    className="w-40 lg:w-48 pl-3 pr-8 py-1 text-xs border border-gray-300 rounded-full focus:outline-none focus:border-black"
                  />
                  <button
                    aria-label="Search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1"
                    onClick={openSearch}
                  >
                    <MagnifyingGlassIcon className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Mobile search icon */}
              <button className="md:hidden p-2" aria-label="Search" onClick={openSearch}>
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-900" />
              </button>

             

              {/* Account */}
              <Link to="/login" className="p-1" aria-label="Account">
                <UserIcon className="h-5 w-5 text-gray-900" />
              </Link>

              {/* Wishlist */}
              <Link to="/wishlist" className="hidden sm:inline-flex p-1 relative" aria-label="Wishlist">
                <HeartIcon className="h-5 w-5 text-gray-900" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-medium">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative p-1" aria-label="Cart">
                <ShoppingBagIcon className="h-5 w-5 text-gray-900" />
                {totalQty > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-medium">
                    {totalQty}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 ml-2"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Bars3Icon className="h-5 w-5 text-gray-900" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <SearchDropdown
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        categories={categories}
        initialTerm={search}
        topOffset={searchTopOffset}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between h-12">
              <img
                src={content?.branding?.logoUrl || '/logo.jpg'}
                alt={siteName}
                className="h-10 object-contain"
              />
              <button
                className="h-10 w-10 inline-flex items-center justify-center"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-6">
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li key={category.name}>
                    <div className="border-b border-gray-100">
                      <Link to={`/category/${encodeURIComponent(category.name)}`} className="block py-3 text-sm font-medium text-gray-900 uppercase tracking-wide" onClick={() => setMobileOpen(false)}>
                        {category.name}
                      </Link>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="pl-4 pb-2">
                          {category.subcategories.map((subcategory) => (
                            <Link
                              key={subcategory}
                              to={`/category/${encodeURIComponent(category.name)}?sub=${encodeURIComponent(subcategory)}`}
                              className="block py-1 text-sm text-gray-600 hover:text-gray-900 no-underline"
                              style={{ textDecoration: 'none' }}
                              onClick={() => setMobileOpen(false)}
                            >
                              <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[1px] after:w-full after:bg-current after:origin-left after:scale-x-0 after:transition-transform after:duration-500 after:ease-out hover:after:scale-x-100">
                                {subcategory}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </header>
  )
}
