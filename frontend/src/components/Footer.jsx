import { Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext.jsx'
import { formatBrandName } from '../utils/brandName.js'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
      <div className="mt-3 h-px w-full bg-white/20" />
      <div className="mt-5">
        {children}
      </div>
    </div>
  )
}

export default function Footer() {
  const { content } = useContent()

  const siteName = formatBrandName(content?.branding?.siteName)

  const addressLine1 = 'Mundka, New west delhi,'
  const addressLine2 = 'Delhi 110041'

  const socialLinks = (content?.socialMedia || [])
    .filter(social => {
      if (!social?.enabled || !social?.platform) return false
      if (social.platform === 'YouTube') return social.url || social.handle
      return !!social.url
    })
    .map(social => {
      let href = social.url
      if (social.platform === 'YouTube' && social.handle && !social.url) {
        href = `https://youtube.com/@${social.handle}`
      }
      return { platform: social.platform, href }
    })

  const navItems = content?.homepage?.header?.navigation || []
  const shopLinks = navItems
    .filter(item => item?.name && item?.link)
    .map(item => ({ label: item.name, to: item.link }))

  const supportLinks = [
    { label: 'Return & Exchange Policy', to: '/refund-exchange-policy' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Shipping', to: '/shipping-policy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' }
  ]

  const shopLeft = shopLinks.slice(0, Math.ceil(shopLinks.length / 2))
  const shopRight = shopLinks.slice(Math.ceil(shopLinks.length / 2))
  const supportLeft = supportLinks.slice(0, Math.ceil(supportLinks.length / 2))
  const supportRight = supportLinks.slice(Math.ceil(supportLinks.length / 2))

  return (
    <footer className="bg-black mt-6">
      <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Left */}
          <div>
            <Link to="/" className="inline-flex items-center">
              {content?.branding?.logoUrl ? (
                <img
                  src={content.branding.logoUrl}
                  alt={siteName || 'Logo'}
                  className="h-12 sm:h-14 w-auto"
                  loading="lazy"
                />
              ) : (
                <div className="text-3xl font-extrabold text-white">
                  {siteName}
                </div>
              )}
            </Link>

            {/* Social icons row */}
            {socialLinks.length > 0 && (
              <div className="mt-3 flex items-center gap-4 text-white">
                {socialLinks.map(({ platform, href }) => (
                  <a
                    key={platform}
                    href={href}
                    aria-label={platform}
                    className="hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {platform === 'Facebook' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5 9.5V7.75c0-.6.15-1.01 1.2-1.01H16V4h-2.1C11.68 4 10.5 5.1 10.5 7.3V9.5H9V12h1.5v8h3v-8h2l.5-2.5h-2.5Z" />
                      </svg>
                    )}
                    {platform === 'Instagram' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.25 2.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
                      </svg>
                    )}
                    {platform === 'X' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                      </svg>
                    )}
                    {platform === 'TikTok' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1Z" />
                      </svg>
                    )}
                    {platform === 'Pinterest' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.742-1.378l-.742 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.017.001z" />
                      </svg>
                    )}
                    {platform === 'YouTube' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-2 text-sm text-white/70">
              <div className="font-medium text-white/80">{siteName}</div>
              <div className="leading-5">
                <div>{addressLine1}</div>
                <div>{addressLine2}</div>
              </div>
              <div className="text-white/70">
                <span className="text-white/80 font-semibold">GST</span> - 07ACIFA1497R1ZO
              </div>
            </div>
          </div>

          {/* Middle: Shop */}
          <Section title="Shop">
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
              <ul className="space-y-3">
                {shopLeft.length > 0 ? shopLeft.map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-white/80 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                )) : (
                  <li className="text-white/60">No links</li>
                )}
              </ul>
              <ul className="space-y-3">
                {shopRight.map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-white/80 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Right: Support */}
          <Section title="Support">
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
              <ul className="space-y-3">
                {supportLeft.map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-white/80 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {supportRight.map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-white/80 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10">
          <div className="text-xs text-white/50 text-center lg:text-left">
            © 2026 {siteName}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
