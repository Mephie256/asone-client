/**
 * Every active SKU, for a picker.
 *
 * Fetched whole rather than searched: AsOne's catalogue is tens of SKUs, not
 * thousands, and a picker that has them all can be typed into without a
 * round trip per keystroke. Capped at the server's page size of 200 — the day
 * that stops being enough, this is the one place to page it.
 *
 * The sibling of `useWarehouseOptions`, and the single owner of this query
 * key: production orders, adjustments and transfers all reach for the same
 * list, and three copies of it is three caches that disagree.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'

export function useSkuOptions(enabled = true) {
  return useQuery({
    queryKey: ['skus', 'orderable'],
    queryFn: () => catalogApi.skus({ is_active: true, page_size: 200 }),
    staleTime: 10 * 60 * 1000,
    enabled,
  })
}
