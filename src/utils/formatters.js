export function netPnl(trade) {
  const profit = Number(trade.profit) || 0
  const commission = Number(trade.commission) || 0
  const swap = Number(trade.swap) || 0
  return profit + commission + swap
}

export function cleanSymbol(symbol) {
  return (symbol || '').replace(/\+$/, '')
}

export function formatMoney(value, { sign = true } = {}) {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const abs = Math.abs(num).toFixed(2)
  if (!sign) return `$${abs}`
  if (num > 0) return `+$${abs}`
  if (num < 0) return `-$${abs}`
  return `$${abs}`
}

export function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const decimals = num >= 50 ? 2 : 5
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function pnlClass(value) {
  if (value > 0) return 'positive-text'
  if (value < 0) return 'negative-text'
  return 'neutral-text'
}

export function sessionForDate(dateStr) {
  if (!dateStr) return '—'
  const hour = new Date(dateStr).getUTCHours()
  if (hour >= 0 && hour < 7) return 'Sydney/Tokyo'
  if (hour >= 7 && hour < 13) return 'London'
  if (hour >= 13 && hour < 21) return 'New York'
  return 'After hours'
}

export function setupForTrade(trade) {
  if (Array.isArray(trade.tags) && trade.tags.length) {
    return trade.tags
      .map((tag) => (typeof tag === 'string' ? tag : tag.name))
      .filter(Boolean)
      .join(', ')
  }
  return trade.comment || 'Manual'
}

export function isSameDay(dateStr, day, month, year) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return (
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === day
  )
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
