/**
 * Every warehouse, for a picker.
 *
 * There are two of these today, so no pagination handling is worth building
 * yet — the day a third or fourth warehouse makes that untrue, this is the
 * one place to add it.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'
import { keys } from '@/api/keys'

export function useWarehouseOptions() {
  const { data, isLoading } = useQuery({
    queryKey: keys.warehouses(),
    queryFn: () => catalogApi.warehouses(),
    staleTime: 10 * 60 * 1000,
  })

  return { warehouses: data?.results ?? [], isLoading }
}
