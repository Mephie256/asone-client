/**
 * Backorder data.
 *
 * Releasing is the only mutation and it is the irreversible one: it assigns
 * responsibility and ships stock in the same transaction.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as backordersApi from '@/api/backorders'
import { snackbar } from '@/components'

export const BACKORDERS_PAGE_SIZE = 15

export function useBackorders(page: number, status: string | null) {
  return useQuery({
    queryKey: ['backorders', 'list', page, status],
    queryFn: () =>
      backordersApi.backorders({
        page,
        page_size: BACKORDERS_PAGE_SIZE,
        ...(status ? { status } : {}),
      }),
    // Paging should not blank the table it is paging.
    placeholderData: keepPreviousData,
  })
}

/** The ones a warehouse could fill today — the Release All queue. */
export function useEligibleBackorders() {
  return useQuery({
    queryKey: ['backorders', 'eligible'],
    queryFn: () => backordersApi.eligibleBackorders(),
  })
}

export function useReleaseEligible() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids?: number[]) => backordersApi.releaseEligible(ids),
    onSuccess: (shipments) => {
      // Stock left warehouses and orders moved on, so everything counting
      // either is stale.
      void queryClient.invalidateQueries({ queryKey: ['backorders'] })
      void queryClient.invalidateQueries({ queryKey: ['shipments'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      const n = shipments.length
      snackbar.success(
        `${n} backorder${n === 1 ? '' : 's'} released`,
        'Each ships direct to the school from the warehouse that had the stock.',
      )
    },
  })
}
