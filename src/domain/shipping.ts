/**
 * How a shipment reads.
 *
 * Pure mapping, kept out of the components so one status cannot pick up two
 * different colours on two screens.
 *
 * ## What the design asks for that cannot exist
 *
 * The mock shows four states: Preparing, Ready, Shipped, Delivered. Only the
 * last two are real, and the reason is structural rather than missing work:
 * **a shipment row does not exist until despatch creates it.** Nothing is
 * ever "preparing" — before despatch there is no shipment, only orders
 * waiting to be picked, which is a different screen and a different table.
 *
 * Showing Preparing and Ready would mean two badges nothing could ever set.
 */

import type { Tone } from '@/components'

export type ShipmentStatus = 'SHIPPED' | 'DELIVERED'

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  SHIPPED: 'In transit',
  DELIVERED: 'Delivered',
}

export function shipmentTone(status: string): Tone {
  switch (status) {
    case 'DELIVERED':
      return 'success'
    case 'SHIPPED':
      return 'info'
    default:
      return 'neutral'
  }
}

export function shipmentLabel(status: string): string {
  return SHIPMENT_STATUS_LABELS[status as ShipmentStatus] ?? status
}

/**
 * How long a parcel has been out, in whole days.
 *
 * Built from local calendar fields via `todayISO`, not `new Date(iso)`,
 * which parses a `YYYY-MM-DD` as UTC midnight and reads a day early west of
 * Greenwich.
 */
export function daysInTransit(shippedOn: string, today: string): number {
  const [ay, am, ad] = shippedOn.split('-').map(Number)
  const [by, bm, bd] = today.split('-').map(Number)
  const from = Date.UTC(ay, am - 1, ad)
  const to = Date.UTC(by, bm - 1, bd)
  return Math.max(0, Math.round((to - from) / 86_400_000))
}
