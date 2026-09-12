/**
 * One tailoring center, as a stacked card with its production-order queue.
 *
 * The three chips and the queue below them are real `ProductionOrder` rows,
 * not mockup filler: "In Production" and "Completed (MO)" from the design
 * are relabelled to what is actually knowable — see `domain/production.ts`
 * for why a Tailoring Center's own workflow (cutting, material prep) is not
 * something this system can see. There is also no "Supervisor" field on a
 * Tailoring Center here, so that line from the mock is left out rather than
 * invented.
 */

import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, SkeletonRows } from '@/components'
import { formatQuantity } from '@/domain/money'
import { fulfilmentTone } from '@/domain/production'
import { useTailoringCenterProductionOrders } from '../hooks/useTailoringCenterProductionOrders'
import type { TailoringCenter } from '@/api/types'

const ROWS_SHOWN = 5

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

interface TailoringCenterCardProps {
  center: TailoringCenter
}

export function TailoringCenterCard({ center }: TailoringCenterCardProps) {
  const navigate = useNavigate()
  const { orders, isLoading } = useTailoringCenterProductionOrders(center.id)

  const activeOrders = orders.filter((order) => order.status === 'OPEN').length
  const awaitingDelivery = orders.filter((order) => order.fulfilment_status === 'AWAITING').length
  const completed = orders.filter((order) =>
    ['RECEIVED', 'CLOSED'].includes(order.fulfilment_status),
  ).length

  return (
    <div className="tc-card">
      <div className="tc-card__header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h2 className="tc-card__title" style={{ margin: 0 }}>
              {center.name}
            </h2>
            <Badge tone={center.is_active ? 'success' : 'neutral'}>
              {center.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {center.address && (
            <div className="tc-card__meta">
              <span className="tc-card__meta-item">
                <MapPin size={14} color="#64748b" aria-hidden />
                {center.address}
              </span>
            </div>
          )}
        </div>

        <div className="tc-card__chips">
          <div className="tc-card__chip">
            <span className="tc-card__chip-label">ACTIVE POS</span>
            <span className="tc-card__chip-value tc-card__chip-value--blue">
              {isLoading ? '—' : activeOrders}
            </span>
          </div>
          <div className="tc-card__chip">
            <span className="tc-card__chip-label">AWAITING DELIVERY</span>
            <span className="tc-card__chip-value tc-card__chip-value--blue">
              {isLoading ? '—' : awaitingDelivery}
            </span>
          </div>
          <div className="tc-card__chip">
            <span className="tc-card__chip-label">COMPLETED</span>
            <span className="tc-card__chip-value tc-card__chip-value--green">
              {isLoading ? '—' : completed}
            </span>
          </div>
        </div>
      </div>

      <h3 className="tc-card__queue-title">Production Orders Queue</h3>

      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : orders.length === 0 ? (
        <p className="hub-panel__empty">No production orders raised on this centre yet.</p>
      ) : (
        <div className="tc-card__table-wrap">
          <table className="tc-card__table">
            <thead>
              <tr>
                <th scope="col">PO #</th>
                <th scope="col">Destination Hub</th>
                <th scope="col">Items Required</th>
                <th scope="col">Batch Qty</th>
                <th scope="col">Required Date</th>
                <th scope="col">Production Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, ROWS_SHOWN).map((order) => (
                <tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/production-orders/${order.id}`)}
                >
                  <td className="tc-card__po-num">#{order.number}</td>
                  <td>{order.warehouse_name}</td>
                  <td>{order.lines.map((l) => l.sku_description).join(', ')}</td>
                  <td className="tc-card__batch-qty">
                    {formatQuantity(order.total_quantity)} units
                  </td>
                  <td>{formatDate(order.due_in_warehouse_date)}</td>
                  <td>
                    <Badge tone={fulfilmentTone(order.fulfilment_status)}>
                      {order.fulfilment_status_display}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
