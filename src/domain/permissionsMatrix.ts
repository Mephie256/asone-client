/**
 * The Permissions Matrix Preview shown on Users & Roles.
 *
 * APPROXIMATE — flag this when reviewing the screen. The design's rows
 * (Receiving, Inventory, Picking, Shipments, Adjustments, Pricing, User
 * Management) do not match the server's seven access-matrix columns
 * (`table_updates`, `production_orders`, `warehouse_receiving_and_shipping`,
 * `inventory_adjustments`, `school_orders`, `backorder_transfers`,
 * `financial_reports`) one for one. The mapping below is a best-effort
 * relabelling so the screen can be built and reviewed now; it is not a
 * second source of truth for what a role may do; `domain/access.ts`'s
 * `can()`, reading the server's real columns, is.
 *
 * Two rows the design shows have no server column to read at all —
 * "Picking" and "Pricing" — so they fall back to the nearest column that
 * plausibly covers them. Call this out to whoever owns the design: either
 * the server's matrix needs finer columns, or these two rows should be
 * dropped or relabelled.
 */

import type { AccessFunction, RoleInfo } from '@/api/types'

export interface MatrixRow {
  label: string
  /** The server column this row reads. */
  function: AccessFunction
  /** True when the row is a stand-in for a column the server does not have. */
  approximate: boolean
}

export const PERMISSIONS_MATRIX_ROWS: readonly MatrixRow[] = [
  { label: 'Receiving', function: 'warehouse_receiving_and_shipping', approximate: false },
  { label: 'Inventory', function: 'inventory_adjustments', approximate: false },
  // No server column distinguishes "picking" from receiving/shipping today.
  { label: 'Picking', function: 'warehouse_receiving_and_shipping', approximate: true },
  { label: 'Shipments', function: 'warehouse_receiving_and_shipping', approximate: false },
  { label: 'Adjustments', function: 'inventory_adjustments', approximate: false },
  // No pricing-specific column exists; financial_reports is the closest.
  { label: 'Pricing', function: 'financial_reports', approximate: true },
  { label: 'User Management', function: 'table_updates', approximate: false },
]

export function matrixCell(role: RoleInfo, row: MatrixRow): boolean {
  return role.functions[row.function] === true
}
