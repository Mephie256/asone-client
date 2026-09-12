/**
 * Days in transit — the figure that tells a school which parcel to chase.
 *
 * Worth testing because the obvious implementation, `new Date(iso)`, parses
 * a YYYY-MM-DD string as UTC midnight and reads a day early in any negative
 * offset. Off by one here means a parcel looks a day fresher than it is.
 */

import { describe, expect, it } from 'vitest'
import { daysInTransit, shipmentLabel, shipmentTone } from './shipping'

describe('daysInTransit', () => {
  it('is zero on the day it shipped', () => {
    expect(daysInTransit('2026-09-12', '2026-09-12')).toBe(0)
  })

  it('counts whole days', () => {
    expect(daysInTransit('2026-09-01', '2026-09-12')).toBe(11)
  })

  it('crosses a month boundary', () => {
    expect(daysInTransit('2026-08-30', '2026-09-02')).toBe(3)
  })

  it('crosses a year boundary', () => {
    expect(daysInTransit('2025-12-30', '2026-01-02')).toBe(3)
  })

  it('never goes negative for a future ship date', () => {
    expect(daysInTransit('2026-09-20', '2026-09-12')).toBe(0)
  })
})

describe('shipmentLabel', () => {
  it('reads SHIPPED as in transit, which is what it means to a school', () => {
    expect(shipmentLabel('SHIPPED')).toBe('In transit')
    expect(shipmentLabel('DELIVERED')).toBe('Delivered')
  })

  it('passes through a status this build has not seen', () => {
    expect(shipmentLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
  })
})

describe('shipmentTone', () => {
  it('does not blank the badge for an unknown status', () => {
    expect(shipmentTone('SOMETHING_NEW')).toBe('neutral')
  })
})
