/**
 * Dates, for display.
 *
 * The API speaks `YYYY-MM-DD` for dates and ISO 8601 for timestamps. Nothing
 * here parses or reformats anything the server computed — these turn a value
 * into words for a person to read.
 */

const MONTHS = [
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

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * The Monday-to-Sunday week containing `today`, as "01 - 07, September 2026".
 *
 * Computed rather than written down: a banner announcing a fixed week is
 * wrong by the following Monday.
 */
export function currentWeekLabel(today = new Date()): string {
  const day = today.getDay()
  // getDay() is 0 on Sunday; shift so the week starts on Monday.
  const offsetToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(today)
  monday.setDate(today.getDate() + offsetToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  // A week spanning two months has to read correctly, which the design's
  // single-month format cannot do.
  if (monday.getMonth() !== sunday.getMonth()) {
    return `${pad(monday.getDate())} ${MONTHS[monday.getMonth()]} - ${pad(sunday.getDate())} ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`
  }

  return `${pad(monday.getDate())} - ${pad(sunday.getDate())}, ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`
}

/** "10 mins ago". Relative, because the exact timestamp is rarely the point. */
export function relativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const minutes = Math.round((now - then) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}


/**
 * Today, as the person at the keyboard means it.
 *
 * Not `new Date().toISOString().slice(0, 10)`, which is what this replaced
 * in two places. `toISOString()` is UTC, and Uganda is UTC+3 all year — so
 * between midnight and 03:00 in Kampala that expression returns
 * **yesterday**.
 *
 * Two things acted on it. A delivery keyed at 01:30 was filed a day early,
 * and nothing on the receiving screen showed the date to catch it. And a
 * production order's `order_date` is the date the server costs its lines
 * against, so a day early can pick up a superseded price — or a date the
 * garment has no price on at all, which is a 400 after the whole order has
 * been typed.
 */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** True when `a` falls strictly before `b`. Both `YYYY-MM-DD`. */
export function isBefore(a: string, b: string): boolean {
  // String comparison is correct for zero-padded ISO dates, and avoids
  // building two Dates that would each be parsed as UTC midnight.
  return Boolean(a) && Boolean(b) && a < b
}

/**
 * A `YYYY-MM-DD` as "12 May 2026".
 *
 * Split rather than `new Date(iso)`, which reads a bare date as UTC midnight
 * and prints a day early west of Greenwich. Three screens had written this
 * out privately before it was worth having once.
 */
export function formatDay(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** `YYYY-MM-DD` for `days` before today, in local time. */
export function daysAgoISO(days: number, now: Date = new Date()): string {
  const then = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  return todayISO(then)
}
