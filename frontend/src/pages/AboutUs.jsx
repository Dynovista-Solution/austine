import { useEffect } from 'react'

export default function AboutUs() {
  useEffect(() => {
    document.title = 'Our Story – AustineLifestyle'
  }, [])

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Story – AustineLifestyle</h1>

        <div className="mt-6 space-y-4 text-sm text-gray-700 leading-6">
          <p>
            AustineLifestyle began its journey not as a label, but as a manufacturer.
          </p>
          <p>
            Before becoming a fashion brand, we spent years behind the scenes—understanding materials, mastering
            construction, and perfecting the art of footwear manufacturing. Working closely with skilled craftsmen
            and production units, we learned what truly goes into making footwear that lasts, feels right, and
            looks refined.
          </p>
          <p>
            This foundation shaped our philosophy. We didn’t start with trends; we started with quality.
          </p>
          <p>
            As our manufacturing expertise grew, so did our vision—to create a brand that delivers factory-level
            quality directly to customers, without compromises. That’s how AustineLifestyle was born: a footwear
            fashion brand built on technical knowledge, precision, and real-world experience.
          </p>
          <p>
            Every pair of AustineLifestyle footwear reflects our manufacturing roots—from material selection and
            durability testing to comfort engineering and finishing details. Because we understand footwear from
            the inside out, we design with purpose, not shortcuts.
          </p>
          <p>
            Today, AustineLifestyle blends manufacturing excellence with modern fashion, offering footwear that’s
            stylish, comfortable, and dependable for everyday life.
          </p>
          <p className="font-semibold text-gray-900">
            We don’t just design footwear. We build it.
          </p>
        </div>
      </div>
    </div>
  )
}
