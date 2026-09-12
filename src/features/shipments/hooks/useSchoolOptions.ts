/**
 * Option lists for the shipment filters.
 *
 * Master data, so cached hard — sites change about once a year.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalog from '@/api/catalog'
import { keys } from '@/api/keys'

export function useSchools() {
  return useQuery({
    // Every school, unfiltered — this is an option list, not a view.
    queryKey: keys.schools(null, null, null, 1),
    queryFn: () => catalog.schools(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Warehouses, for the source filter.
 *
 * Only fetched for a role that may narrow by site: a warehouse clerk is
 * pinned to their own by the server and is never offered the picker, so
 * fetching the list for them is a request nobody reads.
 */
export function useWarehouseOptions(enabled = true) {
  return useQuery({
    queryKey: keys.warehouses(),
    queryFn: () => catalog.warehouses(),
    staleTime: 10 * 60 * 1000,
    enabled,
  })
}
