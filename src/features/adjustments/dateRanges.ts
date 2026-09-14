/**
 * The ranges the two "Date Range" pickers offer.
 *
 * Its own file, not the filter bar's, for the same reason `pageWindow` is:
 * a module that exports both a component and a constant loses fast refresh,
 * and two screens share this one.
 *
 * Days back rather than named periods, so the bound is one subtraction from
 * today. "This year" and "last month" each need a different rule, and neither
 * is what somebody auditing a stock figure actually asks for.
 */

export interface DateRange {
  /** Days back from today, or null for everything ever posted. */
  days: number | null
  label: string
}

export const DATE_RANGES: readonly DateRange[] = [
  { days: 30, label: 'Last 30 Days' },
  { days: 90, label: 'Last 90 Days' },
  { days: 365, label: 'Last 12 Months' },
  { days: null, label: 'All Time' },
]
