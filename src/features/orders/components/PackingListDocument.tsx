/**
 * The delivery slip — F40.
 *
 * The server returns the packing list as data and says so explicitly:
 * "Returns data, not a PDF — rendering it is the frontend's job." So this is
 * the rendering, and the browser's own print dialogue produces the paper.
 *
 * One document per shipment. An order can ship more than once — a short
 * order part-picked now and completed later — so this renders each.
 *
 * Hidden on screen and revealed only for print, which is why the whole thing
 * lives in the page rather than a new window: a popup would lose the app's
 * stylesheet and be blocked as often as not.
 */

import type { PackingList } from '@/api/types'

export function PackingListDocument({ lists }: { lists: PackingList[] }) {
  return (
    <div className="packing-print print-only" aria-hidden>
      {lists.map((list) => (
        <article className="slip" key={list.shipment_number}>
          <header className="slip__head">
            <div>
              <p className="slip__brand">AsOne Logistics</p>
              <p className="slip__sub">Uniform sourcing &amp; distribution</p>
            </div>
            <div className="slip__meta">
              <p>
                <strong>Delivery slip</strong> {list.shipment_number}
              </p>
              <p>Shipped {list.shipped_on}</p>
              {list.waybill_number && <p>Waybill {list.waybill_number}</p>}
            </div>
          </header>

          <dl className="slip__facts">
            <div>
              <dt>Deliver to</dt>
              <dd>
                {list.school}
                {list.school_address && <span> · {list.school_address}</span>}
              </dd>
            </div>
            <div>
              {/* F42: one van can carry several invoices, so the header
                  lists them and each line names its own student. */}
              <dt>{list.order_numbers.length === 1 ? 'Invoice' : 'Invoices'}</dt>
              <dd>{list.order_numbers.join(', ')}</dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>
                {list.from_warehouse}
                {/* Worth printing: whoever receives it needs to know the
                    goods came from a different warehouse than usual. */}
                {list.is_direct_from_another_warehouse && <span> (direct)</span>}
              </dd>
            </div>
          </dl>

          <table className="slip__table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Invoice</th>
                <th>SKU</th>
                <th>Description</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {/*
                Keyed on invoice + SKU, not SKU alone: two students on one
                van can both be getting a size 8 shirt, and that is two
                lines, not a duplicate key.
              */}
              {list.lines.map((line) => (
                <tr key={`${line.invoice_number}-${line.sku_number}`}>
                  <td>{line.student_name}</td>
                  <td>{line.invoice_number}</td>
                  <td>{line.sku_number}</td>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total units</td>
                <td>{list.total_units}</td>
              </tr>
            </tfoot>
          </table>

          <p className="slip__sign">Received by ………………………………  Date ………………………</p>
        </article>
      ))}
    </div>
  )
}
