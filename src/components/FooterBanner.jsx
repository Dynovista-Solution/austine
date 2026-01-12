import { useEffect, useState } from 'react'
import { useContent } from '../context/ContentContext'

export default function FooterBanner() {
  const { content } = useContent()
  
  // Don't render if footer banner is disabled
  if (!content.homepage.footerBanner?.enabled) {
    return null
  }
  
  const messages = content.homepage.footerBanner?.messages || [
    'Free Shipping Over 1500Rs.',
    'Easy 30-Day Returns',
    'Join & Get 10% Off Your First Order'
  ]
  
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % messages.length)
        setFade(true)
      }, 300) // match transition
    }, 3000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <section className="mt-12 select-none">
      <div className="relative w-full bg-white">
        {/* Top line (black) */}
        <div className="h-[1px] w-full bg-black" />
        {/* Center row with text perfectly centered */}
        <div className="relative flex items-center justify-center h-12 sm:h-14">
          <div
            className={`px-4 text-center font-bold tracking-wide text-black text-[11px] sm:text-[12px] leading-none transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
          >
            {messages[index]}
          </div>
        </div>
    {/* Bottom line (black) */}
    <div className="h-[1px] w-full bg-black" />
      </div>
    </section>
  )
}
