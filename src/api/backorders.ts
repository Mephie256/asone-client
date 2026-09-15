/**
 * Orders waiting for stock — F43, F44, F45.
 *
 * ---------------------------------------------------------------------------
 * There is no backorder object
 * ---------------------------------------------------------------------------
 * Nothing here creates, resolves or edits one, because a backorder is not a
 * thing anyone makes. An order is *backordered* when it is RELEASED and the
 * warehouse responsible for it cannot fill every line — that is the whole
 * definition. It stops being backordered the moment either of those changes:
 * stock arrives and it can be picked, or it is handed to a warehouse that
 * has the stock.
 *
 * So this file has a queue and one action, and no status to edit.
 *
 * ---------------------------------------------------------------------------
 * Nothing part-ships
 * ---------------------------------------------------------------------------
 * Page 8 of AsOne's pack: an order short on one line is held whole. A school
 * never receives a parcel with half the uniform in it, so a single missing
 * shirt holds the trousers too. That rule is why the queue is orders rather
 * than SKUs.
 *
 * The per-SKU `/orders/backorders/` endpoints are **not used**. They belong
 * to the part-shipping reading of decision D2, which AsOne have not
 * confirmed, and until they do those tables stay empty.
 */

import { get, post } from './http'
import type { SchoolOrder } from './types'

/** One SKU an order is short of, at the warehouse responsible for it. */
export interface Shortfall {
  sku: string
  description: string
  needed: number
  available: number
  shortfall: number
}

export interface OrderAwaitingStock {
  order: SchoolOrder
  waiting_on: Shortfall[]
}

/**
 * The held-order queue, **oldest first**.
 *
 * That ordering is the FIFO rule from p.8, not a default — do not re-sort it
 * on the client. Warehouse staff get their own warehouse whatever they ask
 * for; an all-locations role passes one.
 */
export function ordersAwaitingStock(warehouseId?: number | null) {
  return get<OrderAwaitingStock[]>(
    '/orders/awaiting-stock/',
    warehouseId ? { warehouse: warehouseId } : undefined,
  )
}

/**
 * Warehouses that hold enough of **every** line to finish this order.
 *
 * The only source for the dropdown. A clerk cannot see another site's
 * shelves, so letting them pick freely is how an order gets sent somewhere
 * empty. An empty array means nobody can fill it yet — which is an answer,
 * not an error.
 */
export function transferCandidates(orderId: number) {
  return get<{ id: number; name: string }[]>(
    `/orders/school-orders/${orderId}/transfer-candidates/`,
  )
}

/**
 * Hand the order to a warehouse that has the stock — F45.
 *
 * **Nothing moves in the ledger.** No stock is reserved at either end; the
 * receiving warehouse picks in the ordinary way afterwards and that pick is
 * what touches inventory. What changes is who is responsible.
 *
 * The school keeps its primary warehouse. A transfer moves one order, never
 * the relationship.
 */
export function transferOrder(orderId: number, warehouseId: number, reason: string) {
  return post<SchoolOrder>(`/orders/school-orders/${orderId}/transfer/`, {
    warehouse: warehouseId,
    ...(reason.trim() ? { reason: reason.trim() } : {}),
  })
}
