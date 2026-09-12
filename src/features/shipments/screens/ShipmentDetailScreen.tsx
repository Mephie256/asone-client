/**
 * One shipment — what is on the van, and whose.
 *
 * Two columns, as the design draws them: the orders included on the left,
 * the combined packing inventory on the right. On a consolidated van (F42)
 * the same SKU appears once per student, which is the point — collapsing
 * them would lose whose is whose.
 *
 * ## What the design shows that is not here
 *
 * **"Mark as Shipped".** By the time a shipment exists it has already
 * shipped — despatch is what creates it, and it moves stock in the same
 * transaction. The button would have nothing to do.
 *
 * **"Add Order".** Loading another order onto a van already gone would mean
 * moving stock out a second time under the same document. Despatch the rest
 * as its own van instead; an order split across two vans is handled, and
 * completes only when both are confirmed.
 */

import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Package, Printer } from 'lucide-react'
import { Badge, Button, LoadingScreen } from '@/components'
import { todayISO } from '@/domain/dates'
import { formatQuantity } from '@/domain/money'
import { daysInTransit, shipmentLabel, shipmentTone } from '@/domain/shipping'
import { AppShell } from '@/features/shell/components/AppShell'
import { useShipment } from '../hooks/useShipments'

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ShipmentDetailScreen() {
  const { shipmentId } = useParams()
  const id = Number(shipmentId)
  const { data: shipment, isLoading, isError } = useShipment(id)

  if (isLoading) return <LoadingScreen message="Loading shipment" />

  if (isError || !shipment) {
    return (
      <AppShell title="Shipping">
        <p className="panel__clear">That shipment could not be loaded.</p>
      </AppShell>
    )
  }

  const lines = shipment.lines ?? []
  const out = daysInTransit(shipment.shipped_on, todayISO())

  // Each order on the van, with its own lines under it.
  const byOrder = new Map<string, { student: string; units: number }>()
  for (const line of lines) {
    const entry = byOrder.get(line.order_number) ?? {
      student: line.student_name,
      units: 0,
    }
    entry.units += line.quantity
    byOrder.set(line.order_number, entry)
  }

  return (
    <AppShell title="Shipping">
      <nav className="crumbs no-print" aria-label="Breadcrumb">
        <Link to="/shipments">Shipments</Link>
        <ChevronRight size={14} aria-hidden />
        <span aria-current="page">{shipment.number}</span>
      </nav>

      <header className="page-head page-head--split">
        <div>
          <h1 className="page-head__title detail-head__title">
            {shipment.number}
            <Badge tone={shipmentTone(shipment.status)}>
              {shipmentLabel(shipment.status)}
            </Badge>
          </h1>
          <p className="page-head__subtitle">
            {shipment.order_count} order{shipment.order_count === 1 ? '' : 's'} ·{' '}
            {formatQuantity(shipment.total_quantity)} garments
          </p>
        </div>

        <div className="detail-head__actions no-print">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} aria-hidden />
            Print Packing List
          </Button>
        </div>
      </header>

      <div className="fact-cards">
        <section className="fact-card">
          <p className="fact-card__label">Destination School</p>
          <p className="fact-card__value">{shipment.school_name}</p>
          <p className="fact-card__note">Consignee</p>
        </section>

        <section className="fact-card">
          <p className="fact-card__label">Origin Storage</p>
          <p className="fact-card__value">{shipment.from_warehouse_name}</p>
          <p className="fact-card__note">
            {shipment.waybill_number ? `Waybill ${shipment.waybill_number}` : 'No waybill recorded'}
          </p>
        </section>

        <section className="fact-card">
          <p className="fact-card__label">Ship Date</p>
          <p className="fact-card__value">{formatDate(shipment.shipped_on)}</p>
          <p className="fact-card__note">
            {shipment.received_at
              ? `Confirmed ${formatDate(shipment.received_at)}`
              : `${out} day${out === 1 ? '' : 's'} in transit`}
          </p>
        </section>
      </div>

      <div className="detail-columns">
        <section className="card-panel">
          <h2 className="card-panel__title card-panel__title--accent">
            Combined Packing Inventory
          </h2>

          <div className="table-scroll">
            <table className="ledger">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Description</th>
                  <th className="ledger__num">Qty</th>
                  <th>Target Student</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {/*
                  Keyed on the line id, not the SKU: two students on one van
                  can both be getting a size 8 shirt, and that is two rows.
                */}
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="ledger__code">{line.sku_number}</td>
                    <td className="ledger__wrap">{line.sku_description}</td>
                    <td className="ledger__num ledger__strong">{line.quantity}</td>
                    <td>{line.student_name}</td>
                    <td className="ledger__code">{line.order_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card-panel">
          <h2 className="card-panel__title card-panel__title--accent">
            Included Orders ({shipment.order_count})
          </h2>

          <ul className="included">
            {[...byOrder.entries()].map(([number, entry]) => (
              <li className="included__item" key={number}>
                <span className="included__icon" aria-hidden>
                  <Package size={16} />
                </span>
                <div>
                  <p className="included__number">{number}</p>
                  <p className="included__student">{entry.student}</p>
                  <p className="included__meta">{entry.units} items on this van</p>
                </div>
              </li>
            ))}
          </ul>

          {shipment.received_at ? (
            <p className="card-panel__note">
              The school confirmed this arrived on {formatDate(shipment.received_at)}.
              {shipment.receipt_notes && ` “${shipment.receipt_notes}”`}
            </p>
          ) : (
            <p className="card-panel__note">
              Awaiting confirmation from {shipment.school_name}. Each order on this van
              completes once every van carrying part of it is confirmed.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  )
}
