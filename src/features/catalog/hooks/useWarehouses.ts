/**
 * Warehouses — master data list.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'
import { keys } from '@/api/keys'

export interface WarehouseFilters {
  page: number
}

export function useWarehouses(filters: WarehouseFilters) {
  const { data, isLoading, isError } = useQuery({
    queryKey: keys.warehousesList(null, filters.page),
    queryFn: () => catalogApi.warehouses({ page: filters.page }),
  })

  return {
    warehouses: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  }
}
