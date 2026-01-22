import { useEffect } from 'react'

export default function Lightbox({
  images,
  index,
  onChangeIndex,
  onClose
}) {
  const list = Array.isArray(images) ? images : []
  const hasMany = list.length > 1

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (!hasMany) return
      if (e.key === 'ArrowLeft') onChangeIndex?.((index - 1 + list.length) % list.length)
      if (e.key === 'ArrowRight') onChangeIndex?.((index + 1) % list.length)
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [hasMany, index, list.length, onChangeIndex, onClose])

  const current = list[index]
  if (!current?.url) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // Click outside image closes
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <button
        type="button"
        onClick={() => onClose?.()}
        className="absolute top-4 right-4 px-3 py-2 text-sm bg-white/10 text-white rounded hover:bg-white/20"
        aria-label="Close"
      >
        Close
      </button>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() => onChangeIndex?.((index - 1 + list.length) % list.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-2 text-sm bg-white/10 text-white rounded hover:bg-white/20"
            aria-label="Previous"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onChangeIndex?.((index + 1) % list.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-2 text-sm bg-white/10 text-white rounded hover:bg-white/20"
            aria-label="Next"
          >
            Next
          </button>
        </>
      )}

      <div className="h-full w-full flex items-center justify-center p-6">
        <img
          src={current.url}
          alt={current.alt || 'Lookbook image'}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />
      </div>

      {hasMany && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/80">
          {index + 1} / {list.length}
        </div>
      )}
    </div>
  )
}
