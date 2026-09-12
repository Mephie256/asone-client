/**
 * Each warehouse's own dashboard summary, fetched in parallel.
 *
 * Reuses `/api/dashboard/summary/?warehouse=`, the same endpoint the
 * warehouse dashboard itself is built from — see `api/dashboard.ts`'s
 * header comment for why that beats summing the underlying resources on
 * the client. A lead may pass any warehouse id here (`_WarehouseScoped`
 * on the server resolves `?warehouse=` for all-locations roles), which is
 * exactly what the Warehouses list needs: one card per site, each with
 * its own real numbers.
 */

import { useQueries } from '@tanstack/react-query'
import * as dashboardApi from '@/api/dashboard'
import { keys } from '@/api/keys'

export function useWarehouseSummaries(warehouseIds: number[]) {
  const results = useQueries({
    queries: warehouseIds.map((id) => ({
      queryKey: keys.summary(id),
      queryFn: () => dashboardApi.summary({ warehouse: id }),
    })),
  })

  const summaries = new Map(
    warehouseIds.map((id, index) => [id, results[index]?.data ?? null]),
  )

  return {
    summaries,
    isLoading: results.some((result) => result.isLoading),
  }
}
