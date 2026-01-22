import { useContent } from '../context/ContentContext'

export default function Hero() {
  const { content } = useContent()
  const hero = content.homepage.hero

  return (
    <section className="relative">
      {/* Background Image area */}
  <div className="relative h-[85vh] min-h-[460px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              `url('${hero.imageUrl || '/hero.jpg'}'), radial-gradient(1200px 600px at 70% 10%, rgba(0,0,0,0.05), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0))`,
          }}
        />
        {/* Subtle left-to-right gradient to improve legibility of left text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-transparent" />

        {/* Content */}
        <div className="relative z-10 h-full max-w-[1200px] mx-auto px-4 flex items-center">
          <div className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-wide">{hero.title}</h2>
            <p className="mt-4 text-base sm:text-lg md:text-2xl/relaxed max-w-[38ch]">
              {hero.subtitle}
            </p>
            <div className="mt-6 space-x-4">
              <a
                href={hero.primaryButton.link}
                className="inline-flex items-center rounded-md bg-white/95 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white"
              >
                {hero.primaryButton.text}
              </a>
              {hero.secondaryButton && (
                <a
                  href={hero.secondaryButton.link}
                  className="inline-flex items-center rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/10"
                >
                  {hero.secondaryButton.text}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
