/**
 * The four queue panels on a warehouse's hub console.
 *
 * Each is a preview over a real, already-existing endpoint — nothing here
 * invents a status the server does not have. Two honest gaps, stated rather
 * than filled:
 *
 *   Active Picking Queue has no assignee. `PartProcessedOrderSerializer`
 *   does not name who is picking an order — nobody is assigned one in this
 *   system — so the row shows the order and the school, not a person. Every
 *   row here also shares one real status: the report's own query is
 *   `status=PICKED`, so the badge shows that fact rather than inventing a
 *   second "in progress" state the server cannot tell apart from it.
 *
 *   Recent Dispatch Logs has no full list screen yet (`/shipments` is a
 *   placeholder), so unlike the other panels it states "+N more" rather
 *   than linking somewhere unfinished.
 */

import { FileText, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, SkeletonRows } from '@/components'
import { formatQuantity } from '@/domain/money'
import { fulfilmentTone } from '@/domain/production'
import { paths } from '@/routes/paths'
import type { PartProcessedOrder, ProductionOrder, ReorderAlert, Shipment } from '@/api/types'

const ROWS_SHOWN = 6

function lineSummary(order: ProductionOrder): string {
  const descriptions = order.lines.map((line) => line.sku_description).join(', ')
  return `${descriptions} (${formatQuantity(order.total_quantity)} items)`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface IncomingProductionPanelProps {
  orders: ProductionOrder[]
  total: number
  loading: boolean
}

export function IncomingProductionPanel({ orders, total, loading }: IncomingProductionPanelProps) {
  return (
    <div className="hub-panel">
      <div className="hub-panel__header">
        <h2 className="hub-panel__title">Incoming Production from TCs</h2>
        {!loading && total > 0 && (
          <Badge tone="info">
            {total} ACTIVE PO{total === 1 ? '' : 'S'}
          </Badge>
        )}
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : orders.length === 0 ? (
        <p className="hub-panel__empty">No production orders are open on this warehouse.</p>
      ) : (
        orders.slice(0, ROWS_SHOWN).map((order) => (
          <div className="hub-card-item" key={order.id}>
            <div className="hub-card-item__left">
              <div className="hub-card-item__icon">
                <FileText size={16} />
              </div>
              <div className="hub-card-item__text">
                <p className="hub-card-item__title">
                  #{order.number} - {order.tailoring_center_name}
                </p>
                <p className="hub-card-item__subtitle">{lineSummary(order)}</p>
              </div>
            </div>
            <Badge tone={fulfilmentTone(order.fulfilment_status)}>
              {order.fulfilment_status_display}
            </Badge>
          </div>
        ))
      )}

      {!loading && total > ROWS_SHOWN && (
        <Link to={paths.productionOrders} className="hub-panel__link">
          View all {total} production orders
        </Link>
      )}
    </div>
  )
}

interface LowStockAlertsPanelProps {
  alerts: ReorderAlert[]
  loading: boolean
}

export function LowStockAlertsPanel({ alerts, loading }: LowStockAlertsPanelProps) {
  const shown = alerts.slice(0, ROWS_SHOWN)

  return (
    <div className="hub-panel">
      <div className="hub-panel__header">
        <h2 className="hub-panel__title">Low Stock Alerts</h2>
        {!loading && alerts.length > 0 && <Badge tone="error">{alerts.length} Critical</Badge>}
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : alerts.length === 0 ? (
        <p className="hub-panel__empty">Nothing is below its reorder floor at this warehouse.</p>
      ) : (
        shown.map((alert) => (
          <div className="hub-card-item" key={alert.sku_number}>
            <div className="hub-card-item__text">
              <p className="hub-card-item__title">{alert.sku_number}</p>
              <p className="hub-card-item__subtitle">{alert.sku_description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#dc2626', fontSize: 14 }}>
                {formatQuantity(alert.level)} units
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                Safety Limit: {formatQuantity(alert.minimum)}
              </p>
            </div>
          </div>
        ))
      )}

      {!loading && alerts.length > shown.length && (
        <p className="hub-panel__empty">+{alerts.length - shown.length} more below floor</p>
      )}
    </div>
  )
}

interface PickingQueuePanelProps {
  orders: PartProcessedOrder[]
  total: number
  loading: boolean
}

export function PickingQueuePanel({ orders, total, loading }: PickingQueuePanelProps) {
  return (
    <div className="hub-panel">
      <div className="hub-panel__header">
        <h2 className="hub-panel__title">Active Picking Queue</h2>
        {!loading && total > ROWS_SHOWN && (
          <Link to="/orders" className="hub-panel__link">
            View All Queue
          </Link>
        )}
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : orders.length === 0 ? (
        <p className="hub-panel__empty">Nothing picked is waiting on a shipment.</p>
      ) : (
        orders.slice(0, ROWS_SHOWN).map((order) => (
          <div className="hub-card-item" key={order.id}>
            <div className="hub-card-item__left">
              <div className="hub-card-item__icon">
                <Package size={16} />
              </div>
              <div className="hub-card-item__text">
                <p className="hub-card-item__title">
                  #{order.number} • {order.school_name}
                </p>
                <p className="hub-card-item__subtitle">Student: {order.student_name}</p>
              </div>
            </div>
            <Badge tone="success">{order.status_display}</Badge>
          </div>
        ))
      )}
    </div>
  )
}

interface DispatchLogPanelProps {
  shipments: Shipment[]
  total: number
  loading: boolean
}

export function DispatchLogPanel({ shipments, total, loading }: DispatchLogPanelProps) {
  const shown = shipments.slice(0, ROWS_SHOWN)

  return (
    <div className="hub-panel">
      <div className="hub-panel__header">
        <h2 className="hub-panel__title">Recent Dispatch Logs</h2>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : shipments.length === 0 ? (
        <p className="hub-panel__empty">Nothing has shipped from this warehouse yet.</p>
      ) : (
        shown.map((shipment) => (
          <div className="hub-dispatch-item" key={shipment.id}>
            <div className="hub-dispatch-item__left">
              <div className="hub-dispatch-item__dot" />
              <div>
                {/*
                  A van is addressed to a school and carries several orders
                  (F42), so it is named by its own number and its consignee.
                  This used to read `order_number` and `order_school_name`,
                  which a shipment has never had.
                */}
                <p className="hub-dispatch-item__title">
                  {shipment.number} — {shipment.school_name}
                </p>
                <p className="hub-dispatch-item__meta">
                  {formatDate(shipment.shipped_on)} ·{' '}
                  {shipment.order_count} order{shipment.order_count === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <Badge tone={shipment.received_at ? 'success' : 'info'}>
              {shipment.received_at ? 'Delivered' : 'In Transit'}
            </Badge>
          </div>
        ))
      )}

      {!loading && total > shown.length && (
        <p className="hub-panel__empty">+{total - shown.length} more dispatched</p>
      )}
    </div>
  )
}
