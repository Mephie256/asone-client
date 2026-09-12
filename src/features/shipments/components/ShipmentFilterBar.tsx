/**
 * The filter band above the shipments table.
 *
 * Every control here is a real server filter — school, warehouse, status and
 * a date range — so narrowing narrows the whole table, not the page in view.
 * Search is the server's too, over shipment number, order number and school.
 */

import { Search } from 'lucide-react'
import type { School, Warehouse } from '@/api/types'
import type { ShipmentFilters } from '@/api/shipments'

interface ShipmentFilterBarProps {
  value: ShipmentFilters
  onChange: (next: ShipmentFilters) => void
  schools: School[]
  warehouses: Warehouse[]
  /** A warehouse clerk is pinned to their site and is not offered a picker. */
  canPickWarehouse: boolean
}

const ANY = ''

export function ShipmentFilterBar({
  value,
  onChange,
  schools,
  warehouses,
  canPickWarehouse,
}: ShipmentFilterBarProps) {
  return (
    <div className="filter-bar">
      <label className="filter-bar__search">
        <Search size={16} aria-hidden />
        <input
          type="search"
          placeholder="Search shipments…"
          aria-label="Search shipments"
          value={value.search ?? ''}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value || undefined })
          }
        />
      </label>

      <label className="filter-bar__field">
        <span>School:</span>
        <select
          aria-label="Destination school"
          value={value.school ?? ANY}
          onChange={(event) =>
            onChange({
              ...value,
              school: event.target.value ? Number(event.target.value) : undefined,
            })
          }
        >
          <option value={ANY}>All</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </label>

      {canPickWarehouse && (
        <label className="filter-bar__field">
          <span>Warehouse:</span>
          <select
            aria-label="Source warehouse"
            value={value.from_warehouse ?? ANY}
            onChange={(event) =>
              onChange({
                ...value,
                from_warehouse: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
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
        <span>Status:</span>
        <select
          aria-label="Status"
          value={value.status ?? ANY}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || undefined) as ShipmentFilters['status'],
            })
          }
        >
          <option value={ANY}>All</option>
          <option value="SHIPPED">In transit</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </label>

      <label className="filter-bar__field">
        <span>From:</span>
        <input
          type="date"
          aria-label="Shipped on or after"
          value={value.shipped_from ?? ''}
          onChange={(event) =>
            onChange({ ...value, shipped_from: event.target.value || undefined })
          }
        />
      </label>

      <label className="filter-bar__field">
        <span>To:</span>
        <input
          type="date"
          aria-label="Shipped on or before"
          min={value.shipped_from}
          value={value.shipped_to ?? ''}
          onChange={(event) =>
            onChange({ ...value, shipped_to: event.target.value || undefined })
          }
        />
      </label>
    </div>
  )
}
