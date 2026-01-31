const CANONICAL_BRAND_NAME = 'Austine Lifestyle LLP'

function normalizeForMatch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
}

export function formatBrandName(input) {
  const raw = String(input || '').trim()
  if (!raw) return CANONICAL_BRAND_NAME

  const normalized = normalizeForMatch(raw)

  // Match common historical variants used across the app/content.
  if (
    normalized === 'austine' ||
    normalized === 'austine llp' ||
    normalized === 'austine lifestyle' ||
    normalized === 'austinelifestyle' ||
    normalized === 'austine lifestyle llp'
  ) {
    return CANONICAL_BRAND_NAME
  }

  // If they already typed something ending in LLP (any casing/punctuation), keep their custom name.
  if (/\bllp\b/i.test(raw)) return raw

  return raw
}
