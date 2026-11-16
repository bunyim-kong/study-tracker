const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseLocalDateKey(dateKey) {
  const match = DATE_KEY_PATTERN.exec(dateKey)
  if (!match) throw new TypeError(`Invalid local date: ${dateKey}`)

  const [, year, month, day] = match.map(Number)
  const date = new Date(year, month - 1, day, 12)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new TypeError(`Invalid local date: ${dateKey}`)
  }

  return date
}

export function toLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid date value: ${value}`)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateKey, amount) {
  const date = parseLocalDateKey(dateKey)
  date.setDate(date.getDate() + Number(amount))
  return toLocalDateKey(date)
}

export function differenceInCalendarDays(fromDateKey, toDateKey) {
  const from = parseLocalDateKey(fromDateKey)
  const to = parseLocalDateKey(toDateKey)
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((toUtc - fromUtc) / 86_400_000)
}

export function getPlanDayNumber(startDate, today = new Date()) {
  return differenceInCalendarDays(startDate, toLocalDateKey(today)) + 1
}

export function formatStudyDate(dateKey, locale = undefined, options = {}) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(parseLocalDateKey(dateKey))
}
