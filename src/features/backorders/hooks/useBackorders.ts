/**
 * Orders waiting for stock.
 *
 * One query and one mutation, because there is nothing else to do to a
 * backorder. It is not a record with a life of its own — it is a released
 * order its warehouse cannot fill, and it stops being one when stock arrives
 * or the order moves.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as backordersApi from '@/api/backorders'
import { snackbar } from '@/components'

export function useOrdersAwaitingStock(warehouseId: number | null) {
  return useQuery({
    queryKey: ['awaiting-stock', warehouseId],
    queryFn: () => backordersApi.ordersAwaitingStock(warehouseId),
  })
}

/**
 * Where this order could go.
 *
 * Fetched per order and only while the dialogue is open — the shortlist is a
 * stock question, so it is worth asking at the moment somebody is about to
 * act on the answer rather than for every row in the queue.
 */
export function useTransferCandidates(orderId: number | null) {
  return useQuery({
    queryKey: ['transfer-candidates', orderId],
    queryFn: () => backordersApi.transferCandidates(orderId as number),
    enabled: orderId !== null,
    // Another warehouse's shelves move while this dialogue is open, and the
    // server checks again on submit anyway.
    staleTime: 0,
  })
}

export function useTransferOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      warehouseId,
      reason,
    }: {
      orderId: number
      warehouseId: number
      reason: string
    }) => backordersApi.transferOrder(orderId, warehouseId, reason),

    onSuccess: (order) => {
      /*
        No stock moved, so the ledger and the stock levels are untouched —
        deliberately not invalidated here. What changed is which warehouse is
        responsible, so the queues either side of the move are stale and so
        is the order itself.
      */
      void queryClient.invalidateQueries({ queryKey: ['awaiting-stock'] })
      void queryClient.invalidateQueries({ queryKey: ['picking'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      snackbar.success(
        `${order.number} moved to ${order.warehouse_name}`,
        `${order.warehouse_name} will pick and ship it straight to ${order.school_name}. No stock has moved, and the school still orders from its own warehouse.`,
      )
    },
  })
}
