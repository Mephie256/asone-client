/**
 * Tailoring Centers — master data list.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'
import { keys } from '@/api/keys'

export interface TailoringCenterFilters {
  page: number
}

export function useTailoringCenters(filters: TailoringCenterFilters) {
  const { data, isLoading, isError } = useQuery({
    queryKey: keys.tailoringCentersList(filters.page),
    queryFn: () => catalogApi.tailoringCenters({ page: filters.page }),
  })

  return {
    tailoringCenters: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  }
}
