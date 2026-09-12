/**
 * A warehouse's hub console — reached from the Warehouses list's "View
 * Dashboard", not the sidebar.
 *
 * Every figure and every row here is real, from the same endpoints the rest
 * of the app already reads — see `useWarehouseHub`. The design's caption for
 * Backorders ("Awaiting TC completion") is not accurate to what
 * `outstanding_backorders` counts — a backorder is filled from *any*
 * warehouse's stock, not gated on a Tailoring Center — so that tile's
 * caption is rewritten to what the figure actually means rather than copied
 * verbatim. Likewise "Shipped Today" is captioned as leaving the warehouse,
 * not as delivered: `Shipment.shipped_on` is when the van left, and whether
 * it arrived is a separate, later fact (`received_at`).
 */

import { Link, useParams } from 'react-router-dom'
import { LoadingScreen } from '@/components'
import { AppShell } from '@/features/shell/components/AppShell'
import { paths } from '@/routes/paths'
import {
  DispatchLogPanel,
  IncomingProductionPanel,
  LowStockAlertsPanel,
  PickingQueuePanel,
} from '../components/WarehouseHubPanels'
import { useWarehouseHub } from '../hooks/useWarehouseHub'

/** A figure that has not arrived reads as a dash, not a zero — zero is a
 * real, meaningful answer here, same as the rest of the dashboard. */
function figure(value: number | undefined, loading: boolean): string {
  if (loading || value === undefined) return '—'
  return value.toLocaleString()
}

export function WarehouseDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const warehouseId = Number(id)

  const {
    warehouse,
    warehouseLoading,
    summary,
    summaryLoading,
    incomingProduction,
    incomingProductionTotal,
    incomingProductionLoading,
    lowStockAlerts,
    lowStockAlertsLoading,
    pickingQueue,
    pickingQueueTotal,
    pickingQueueLoading,
    dispatchLog,
    dispatchLogTotal,
    dispatchLogLoading,
  } = useWarehouseHub(warehouseId)

  if (warehouseLoading) return <LoadingScreen message="Loading warehouse…" />
  if (!warehouse) return <LoadingScreen message="Warehouse not found." />

  return (
    <AppShell title={`${warehouse.name} Hub Console`}>
      <header className="school-detail-header" style={{ marginBottom: 4 }}>
        <p className="school-detail__overline">
          <Link to={paths.warehouses} style={{ color: 'inherit', textDecoration: 'none' }}>
            WAREHOUSES
          </Link>{' '}
          / {warehouse.name.toUpperCase()} HUB
        </p>
        <h1 className="school-detail__main-title">{warehouse.name} Hub Console</h1>
        <p className="school-detail__subtitle">
          Detailed stock levels, upcoming production runs, and lakeside distribution logs.
        </p>
      </header>

      <div className="hub-kpi-grid">
        <div className="hub-kpi-card">
          <span className="hub-kpi-card__label">Available Stock</span>
          <span className="hub-kpi-card__value">
            {figure(summary?.available_units, summaryLoading)}
          </span>
          <span className="hub-kpi-card__caption">Units in local bins</span>
        </div>
        <div className="hub-kpi-card">
          <span className="hub-kpi-card__label">In Picking Queue</span>
          <span className="hub-kpi-card__value">
            {figure(summary?.units_awaiting_pick, summaryLoading)}
          </span>
          <span className="hub-kpi-card__caption">Pending packaging</span>
        </div>
        <div className="hub-kpi-card">
          <span className="hub-kpi-card__label">Shipped Today</span>
          <span className="hub-kpi-card__value">
            {figure(summary?.units_shipped_today, summaryLoading)}
          </span>
          <span className="hub-kpi-card__caption">Left the warehouse today</span>
        </div>
        <div className="hub-kpi-card">
          <span className="hub-kpi-card__label">Backorders</span>
          <span className="hub-kpi-card__value">
            {figure(summary?.outstanding_backorders, summaryLoading)}
          </span>
          <span className="hub-kpi-card__caption">Open or assigned, not yet shipped</span>
        </div>
      </div>

      <div className="hub-grid-2x2">
        <IncomingProductionPanel
          orders={incomingProduction}
          total={incomingProductionTotal}
          loading={incomingProductionLoading}
        />
        <LowStockAlertsPanel alerts={lowStockAlerts} loading={lowStockAlertsLoading} />
        <PickingQueuePanel
          orders={pickingQueue}
          total={pickingQueueTotal}
          loading={pickingQueueLoading}
        />
        <DispatchLogPanel
          shipments={dispatchLog}
          total={dispatchLogTotal}
          loading={dispatchLogLoading}
        />
      </div>
    </AppShell>
  )
}
