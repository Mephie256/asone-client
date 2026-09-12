/**
 * One school's orders, for the Locations detail screen — F30-F36 read-only.
 *
 * Real as of the backend widening `SchoolOrderViewSet.read_roles` to include
 * both leads (9 September 2026, pending AsOne's written confirmation — see
 * `orders/views.py`) and adding a `?school=` filter to go with it. Until
 * then this screen showed an honest "not available for this role" message
 * instead; now it can show the real list.
 */

import { useQuery } from '@tanstack/react-query'
import * as ordersApi from '@/api/orders'
import { keys } from '@/api/keys'

export function useSchoolOrdersForSchool(schoolId: number) {
  const { data, isLoading, isError } = useQuery({
    queryKey: keys.schoolOrdersForSchool(schoolId),
    queryFn: () => ordersApi.schoolOrders({ school: schoolId, page_size: 100 }),
  })

  return {
    orders: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  }
}
