/**
 * The filter band above the adjustments table.
 *
 * Same `.filter-bar` markup as production orders and shipments — one class
 * system for this, not a fourth.
 *
 * Search and type are applied on the client and say so. The endpoint filters
 * on warehouse, sku, reason_code and posted_at; it has no search, and "type"
 * is not a field on the server at all — it is a family of reason codes, read
 * back from the code on each row. Narrowing either one therefore filters the
 * page on screen rather than the whole table, which is why the count under
 * the table keeps saying how many there are in total.
 */

import { Search } from 'lucide-react'
import { ADJUSTMENT_KINDS, type AdjustmentKind } from '@/domain/adjustments'
import { DATE_RANGES } from '../dateRanges'
import type { Warehouse } from '@/api/types'

export interface AdjustmentFilterValue {
  search: string
  kind: AdjustmentKind | null
  /** Days back, or null for everything ever posted. */
  days: number | null
}


interface AdjustmentFilterBarProps {
  value: AdjustmentFilterValue
  onChange: (next: AdjustmentFilterValue) => void
  /** The warehouse picker, omitted for a role with no choice to make. */
  warehouses: Warehouse[]
  warehouseId: number | null
  onWarehouseChange: (id: number | null) => void
  canSwitchWarehouse: boolean
}

const ANY = ''

export function AdjustmentFilterBar({
  value,
  onChange,
  warehouses,
  warehouseId,
  onWarehouseChange,
  canSwitchWarehouse,
}: AdjustmentFilterBarProps) {
  return (
    <div className="filter-bar">
      <label className="filter-bar__search">
        <Search size={16} aria-hidden />
        <input
          type="search"
          placeholder="Search adjustment #, SKU, or user…"
          aria-label="Search adjustment number, SKU or user"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
      </label>

      {canSwitchWarehouse && (
        <label className="filter-bar__field">
          <span>Warehouse:</span>
          <select
            aria-label="Warehouse"
            value={warehouseId ?? ANY}
            onChange={(event) =>
              onWarehouseChange(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value={ANY}>All</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="filter-bar__field">
        <span>Type:</span>
        <select
          aria-label="Adjustment type"
          value={value.kind ?? ANY}
          onChange={(event) =>
            onChange({
              ...value,
              kind: (event.target.value || null) as AdjustmentKind | null,
            })
          }
        >
          <option value={ANY}>All Adjustments</option>
          {ADJUSTMENT_KINDS
            // Transfers are a different document and never appear in this
            // table, so offering the filter would only ever empty it.
            .filter((info) => info.kind !== 'TRANSFER')
            .map((info) => (
              <option key={info.kind} value={info.kind}>
                {info.label}
              </option>
            ))}
        </select>
      </label>

      <label className="filter-bar__field">
        <span>Date Range:</span>
        <select
          aria-label="Date range"
          value={value.days ?? ANY}
          onChange={(event) =>
            onChange({ ...value, days: event.target.value ? Number(event.target.value) : null })
          }
        >
          {DATE_RANGES.map((range) => (
            <option key={range.label} value={range.days ?? ANY}>
              {range.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
