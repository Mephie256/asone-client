/**
 * Backorders — F44, F45, F46.
 *
 * What a school is still owed after a short pick, and how it gets filled.
 *
 * **Releasing is two steps done together.** `assign` moves responsibility to
 * a warehouse that actually holds the stock; `fill` ships it straight to the
 * school. The goods do not route back through the warehouse that ran short —
 * that is the half of decision D2 which overrides the definitions page.
 *
 * Nothing moves in the ledger at assign. What changes is *who owes the
 * school*. Worth knowing when reading the screen: a transfer of a backorder
 * is a transfer of responsibility, not of goods.
 */

import { get, post } from './http'
import type { Backorder, Page, Shipment } from './types'

export type BackorderFilters = {
  status?: string
  page?: number
  page_size?: number
}

export function backorders(params?: BackorderFilters) {
  return get<Page<Backorder>>('/orders/backorders/', params ?? undefined)
}

/**
 * Open backorders some warehouse is holding stock for.
 *
 * Checks **every** warehouse, not just the school's own — stock at Serere
 * can fill a Namayemba shortfall.
 */
export function eligibleBackorders() {
  return get<Backorder[]>('/orders/backorders/eligible/')
}

/** Which warehouses hold enough to fill this one. */
export function fillCandidates(id: number) {
  return get<{ id: number; name: string }[]>(`/orders/backorders/${id}/candidates/`)
}

/**
 * Assign and ship every eligible backorder, or just the ones named.
 *
 * All or nothing: one transaction, so a backorder that cannot be filled
 * halfway through does not leave half the queue released.
 */
export function releaseEligible(ids?: number[]) {
  return post<Shipment[]>(
    '/orders/backorders/release-eligible/',
    ids ? { backorders: ids } : {},
  )
}
