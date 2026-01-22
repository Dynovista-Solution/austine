export function formatINR(value, options = {}) {
  const amount = Number(value)

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(Number.isFinite(amount) ? amount : 0)
}
