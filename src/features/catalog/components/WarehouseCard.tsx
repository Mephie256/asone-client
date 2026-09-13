/**
 * One warehouse, as a card — the Warehouses list's real unit, not a table
 * row.
 *
 * The four stats are real, not mockup filler: they come straight from
 * `/api/dashboard/summary/?warehouse=`, the same endpoint the warehouse
 * hub console itself uses. Address and Primary Tailoring Center show what
 * the server actually has — the server models a missing one as `null`,
 * which is a legitimate state, not a gap to paper over with a guessed
 * street name or a made-up tailoring centre.
 *
 * The two actions are the shared `Button`. They were `schools-modal-btn-*`
 * — the Schools modal's buttons, borrowed for a warehouse card — which is
 * how a card came to depend on a screen it has nothing to do with. The
 * Compass took its colour from a literal hex; it now inherits, like every
 * other icon here.
 */

import { Compass } from 'lucide-react'
import { AnimatedNumber, Badge, Button } from '@/components'
import type { DashboardSummary, Warehouse } from '@/api/types'

interface WarehouseCardProps {
  warehouse: Warehouse
  summary: DashboardSummary | null
  loading: boolean
  onViewDashboard: () => void
  onViewInventory: () => void
}

export function WarehouseCard({
  warehouse,
  summary,
  loading,
  onViewDashboard,
  onViewInventory,
}: WarehouseCardProps) {
  const availableUnits = summary?.available_units
  const pendingOrders = summary?.orders_awaiting_dispatch
  const backorders = summary?.outstanding_backorders
  const lowStockSkus = summary?.skus_below_minimum

  return (
    <div className="site-card">
      <div className="site-card__top">
        <div>
          <h2 className="site-card__title">{warehouse.name}</h2>
          {warehouse.address && <p className="site-card__address">{warehouse.address}</p>}
        </div>
        <Badge tone={warehouse.is_active ? 'success' : 'neutral'}>
          {warehouse.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <p className="site-card__meta-line">
        <Compass size={15} aria-hidden />
        Primary Tailoring: <strong>{warehouse.primary_tailoring_center_name || 'Not set'}</strong>
      </p>

      <div className="site-card__stats">
        <div className="site-card__stat">
          <span className="site-card__stat-label">AVAILABLE STOCK</span>
          <span className="site-card__stat-value">
            <AnimatedNumber value={availableUnits} loading={loading} />
            <span className="site-card__stat-unit"> items</span>
          </span>
        </div>
        <div className="site-card__stat">
          <span className="site-card__stat-label">PENDING ORDERS</span>
          <span className="site-card__stat-value">
            <AnimatedNumber value={pendingOrders} loading={loading} />
            <span className="site-card__stat-unit"> orders</span>
          </span>
        </div>
        <div className="site-card__stat">
          <span className="site-card__stat-label">ACTIVE BACKORDERS</span>
          <span className="site-card__stat-value">
            <AnimatedNumber value={backorders} loading={loading} />
            <span className="site-card__stat-unit"> items</span>
          </span>
        </div>
        <div className="site-card__stat">
          <span className="site-card__stat-label">LOW STOCK SKUS</span>
          <span
            className={`site-card__stat-value${
              !loading && lowStockSkus !== undefined && lowStockSkus > 0
                ? ' site-card__stat-value--alert'
                : ''
            }`}
          >
            <AnimatedNumber value={lowStockSkus} loading={loading} />
            <span className="site-card__stat-unit"> alerts</span>
          </span>
        </div>
      </div>

      <div className="site-card__actions">
        <Button onClick={onViewDashboard} full>
          View Dashboard
        </Button>
        <Button variant="secondary" onClick={onViewInventory} full>
          View Inventory
        </Button>
      </div>
    </div>
  )
}
