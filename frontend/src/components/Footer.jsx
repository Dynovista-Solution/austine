import { Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext.jsx'
import { EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-bold tracking-wide uppercase text-gray-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {children}
      </ul>
    </div>
  )
}

export default function Footer() {
  const { content } = useContent()

  const footerContact = content?.branding?.footerContact || {}
  const addressText = 'Mundka, New west delhi,  Delhi 110045'
  const emailText = footerContact.email || 'info.austinelifestyle@gmail.com'

  return (
  <footer className="bg-white mt-6 font-semibold">
    <div className="w-full pt-5 pb-6 px-6 sm:px-8 lg:px-10">
        {/* Top row: contact left, links right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          {/* Left: logo + contact (like sample) */}
          <div className="lg:pl-6">
            <Link to="/" className="inline-flex items-center">
              {content?.branding?.logoUrl ? (
                <img
                  src={content.branding.logoUrl}
                  alt={content.branding.siteName || 'Logo'}
                  className="h-14 sm:h-16 w-auto"
                  loading="lazy"
                />
              ) : (
                <div className="text-3xl tracking-[0.35em] font-extrabold text-gray-900">
                  {(content?.branding?.siteName || 'AUSTINE').toUpperCase()}
                </div>
              )}
            </Link>

            <div className="mt-4 space-y-3 text-sm text-gray-700 font-medium">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-900 mt-0.5" />
                <div className="leading-5">{addressText}</div>
              </div>
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-900" />
                <a
                  className="hover:underline"
                  href={emailText && emailText !== 'info.austinelifestyle@gmail.com' ? `mailto:${emailText}` : undefined}
                >
                  {emailText}
                </a>
              </div>
              <div className="text-sm text-gray-700">
                <span className="text-gray-900 font-semibold">GST</span> - 07ACIFA1497R1ZO
              </div>
            </div>
          </div>

          {/* Right: Help + Brand */}
          <div className="lg:flex lg:justify-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-16 w-full lg:max-w-3xl">
              <Section title="Help">
                <li><Link to="/contact" className="text-sm text-gray-700 hover:underline">Contact us</Link></li>
                <li><Link to="#" className="text-sm text-gray-700 hover:underline">Track my order</Link></li>
                <li><Link to="/refund-exchange-policy" className="text-sm text-gray-700 hover:underline">Exchanges, Returns & Refunds</Link></li>
              </Section>

              <Section title={content.branding.siteName}>
                <li><Link to="/lookbook" className="text-sm text-gray-700 hover:underline">Lookbook</Link></li>
                <li><Link to="/about" className="text-sm text-gray-700 hover:underline">About us</Link></li>
              </Section>

              <Section title="Our Policies">
                <li><Link to="/terms" className="text-sm text-gray-700 hover:underline">Terms and conditions</Link></li>
                <li><Link to="/privacy" className="text-sm text-gray-700 hover:underline">Privacy Policy</Link></li>
                <li><Link to="/shipping-policy" className="text-sm text-gray-700 hover:underline">Shipping Policy</Link></li>
              </Section>
            </div>
          </div>
        </div>

        {/* Bottom bar (tightened, no divider line) */}
        <div className="mt-4 pt-3">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 md:justify-between">
            <div className="text-[12px] text-gray-500 order-2 md:order-1 md:text-left text-center">
              © 2025 AUSTINE. All rights reserved.
            </div>
            <div className="flex items-center order-1 md:order-2 gap-4 flex-wrap justify-center md:justify-end text-[12px] text-gray-700">
              <div className="flex items-center gap-3 text-gray-900">
                {content.socialMedia.filter(social => {
                  if (!social.enabled || !social.platform) return false
                  if (social.platform === 'YouTube') {
                    return social.url || social.handle
                  }
                  return social.url
                }).map((social) => {
                  let href = social.url
                  if (social.platform === 'YouTube' && social.handle && !social.url) {
                    href = `https://youtube.com/@${social.handle}`
                  }
                  return (
                    <a
                      key={social.platform}
                      href={href}
                      aria-label={social.platform}
                      className="p-1 hover:opacity-80"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {social.platform === 'Facebook' && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13.5 9.5V7.75c0-.6.15-1.01 1.2-1.01H16V4h-2.1C11.68 4 10.5 5.1 10.5 7.3V9.5H9V12h1.5v8h3v-8h2l.5-2.5h-2.5Z"/>
                        </svg>
                      )}
                      {social.platform === 'Instagram' && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.25 2.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/>
                        </svg>
                      )}
                      {social.platform === 'X' && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                        </svg>
                      )}
                      {social.platform === 'TikTok' && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1Z"/>
                        </svg>
                      )}
                      {social.platform === 'Pinterest' && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.742-1.378l-.742 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.017.001z"/>
                        </svg>
                      )}
                      {social.platform === 'YouTube' && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
