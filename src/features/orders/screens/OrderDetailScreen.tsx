/**
 * Order detail — Figma order-details.
 *
 * Breadcrumb, heading, status trail, then two columns: order information and
 * the kit lines on the left, fulfilment and the receipt ledger on the right.
 *
 * Three places the design asks for something the server does not carry, all
 * shown from the nearest real fact rather than invented:
 *
 *   Invoice number   there is no separate invoice series; the order number
 *                    is the invoice number.
 *   Reconciliation   `released_at`, which is when payment was confirmed.
 *   Size and Colour  a line carries `sku_description`, which contains both
 *                    ("Blue Tunic Blue size 10 (PS)") but not as fields. The
 *                    columns are left out rather than split on guesswork.
 */

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PackageCheck, Printer, ShoppingCart, Undo2 } from 'lucide-react'
import {
  Badge,
  Button,
  ConfirmButton,
  LoadingScreen,
  Spinner,
  TextField,
  snackbar,
} from '@/components'
import {
  canConfirmPayment,
  canConfirmReceipt,
  canPlaceSchoolOrder,
  canReadPackingList,
  canReceiveAndShip,
} from '@/domain/access'
import { formatUGX } from '@/domain/money'
import { paymentLabel, paymentTone } from '@/domain/status'
import { AppShell } from '@/features/shell/components/AppShell'
import { OrderBreadcrumb } from '../components/OrderBreadcrumb'
import { OrderStatusTrail } from '../components/OrderStatusTrail'
import { PackingListDocument } from '../components/PackingListDocument'
import {
  useCancelOrder,
  useConfirmReceipt,
  useOrder,
  useOrderShipments,
  useReleaseOrder,
} from '../hooks/useOrder'
import { usePackingLists } from '../hooks/usePackingLists'
import { useUnpickOrder } from '@/features/shipments/hooks/useShipments'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function OrderDetailScreen() {
  const { orderId } = useParams()
  const id = Number(orderId)
  const { user } = useAuth()

  const { data: order, isLoading, isError } = useOrder(id)
  const release = useReleaseOrder(id)
  const cancel = useCancelOrder(id)
  const receipt = useConfirmReceipt(id)

  const [reference, setReference] = useState('')
  const [receiptNotes, setReceiptNotes] = useState('')
  const [parcel, setParcel] = useState<number | null>(null)
  // Set once on the first print click and never reset: the slips are then
  // cached, so later clicks print straight from what is already loaded.
  const [wantsSlips, setWantsSlips] = useState(false)
  const printed = useRef(false)

  /*
   * A slip exists per shipment, so an order that has not shipped has none —
   * being picked is not enough, which is what the button used to check.
   */
  const shipped = order?.status === 'SHIPPED'
  const completed = order?.status === 'COMPLETED'
  /*
   * A slip exists from the moment the order ships and does not stop
   * existing when the school confirms it — a completed order still needs its
   * paperwork reprintable.
   */
  const canSeeSlip = shipped || completed
  const mayPrint = canReadPackingList(user)
  const mayRelease = canConfirmPayment(user)
  const mayReceive = canConfirmReceipt(user)
  const mayCancel = canPlaceSchoolOrder(user)
  const mayPick = canReceiveAndShip(user)
  const unpick = useUnpickOrder()
  const picked = order?.status === 'PICKED'

  /*
   * Which parcel arrived. An order usually has one, and then the server
   * infers it — but a backorder filled by another warehouse ships separately
   * (D2), and the server refuses to guess between two. So the list is
   * fetched only for the role and the state that can act on it, and only to
   * name the shipment.
   */
  const shipments = useOrderShipments(id, shipped && mayReceive)
  const awaiting = (shipments.data ?? []).filter((parcel) => parcel.received_at === null)

  const slips = usePackingLists(id, wantsSlips && canSeeSlip && mayPrint)

  /*
   * Print once the document is in the DOM, not on the click — the markup
   * does not exist until the fetch resolves. A ref rather than state marks
   * it done, so this never schedules another render.
   */
  useEffect(() => {
    if (!wantsSlips || !slips.data || printed.current) return
    printed.current = true

    if (slips.data.length === 0) {
      snackbar.warning('No delivery slip yet', 'One is created when the order ships.')
      return
    }

    window.print()
  }, [wantsSlips, slips.data])

  function printSlips() {
    // Already loaded from an earlier click: straight to the dialogue.
    if (slips.data?.length) {
      window.print()
      return
    }
    printed.current = false
    setWantsSlips(true)
  }

  if (isLoading) return <LoadingScreen message="Loading order…" />

  if (isError || !order) {
    return (
      <AppShell title="Orders">
        <p className="panel__clear">That order could not be loaded.</p>
      </AppShell>
    )
  }

  const onHold = order.status === 'HOLD'
  // Cancellation is F36's "unpaid invoice" and School Staff's column alone:
  // once payment is confirmed, what happens to picked stock and money already
  // taken is a question AsOne has not answered, so the server refuses it.
  const canCancelNow = onHold && mayCancel

  return (
    <AppShell title="Orders">
      <header className="page-head">
        <h1 className="page-head__title">Order detail: {order.number}</h1>
        <p className="page-head__subtitle">
          Manage payment confirmation and release for packing queue.
        </p>
      </header>

      <OrderBreadcrumb number={order.number} />
      <OrderStatusTrail order={order} />

      <div className="order-detail">
        <div className="order-detail__main">
          <section className="card-panel">
            <h2 className="card-panel__title">Order Information</h2>

            {/* Four facts across one row, as designed — not a label/value
                list, which reads as a form rather than a summary. */}
            <dl className="fact-row">
              <div className="fact">
                <dt>School</dt>
                <dd>{order.school_name}</dd>
              </div>
              <div className="fact">
                <dt>Student</dt>
                <dd>{order.student_name}</dd>
              </div>
              <div className="fact">
                <dt>Created at</dt>
                <dd>{new Date(order.created_at).toLocaleString()}</dd>
              </div>
              <div className="fact">
                <dt>Allocated warehouse</dt>
                <dd className="fact__accent">{order.warehouse_name}</dd>
              </div>
            </dl>
          </section>

          <section className="card-panel">
            <h2 className="card-panel__title card-panel__title--accent">Uniform Kit Details</h2>

            <div className="scroll-x">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>From kit</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="ledger__code">{line.sku_number}</td>
                      <td>{line.sku_description}</td>
                      {/* Each line remembers the kit it came from, so the
                          school sees what it chose and the warehouse picks
                          garments. */}
                      <td>{line.from_kit_number || '—'}</td>
                      <td className="t-numeric">{line.quantity}</td>
                      <td className="t-numeric">{formatUGX(line.unit_price)}</td>
                      <td className="t-numeric ledger__strong">{formatUGX(line.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="order-detail__side">
          <section className="card-panel">
            <h2 className="card-panel__title">Fulfillment Queue Control</h2>

            <div className="stack-actions">
              {onHold && mayRelease && (
                <>
                  {/* Releasing IS the payment confirmation, so the reference
                      is asked for here rather than at an earlier step that
                      does not exist. */}
                  <TextField
                    label="Payment reference"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                  />
                  <Button
                    size="lg"
                    disabled={release.isPending}
                    onClick={() => release.mutate(reference || undefined)}
                  >
                    <ShoppingCart size={16} aria-hidden />
                    {release.isPending ? 'Releasing…' : 'Release for Picking'}
                  </Button>
                </>
              )}

              {onHold && !mayRelease && (
                /*
                  Only Finance may confirm payment — the server refuses
                  everybody else. Saying who can do it is more use than a
                  button that fails, and this is the seam for open question
                  Q2: if "School Monitor" turns out to be somebody else,
                  canConfirmPayment and the server's class change together.
                */
                <p className="card-panel__note">
                  Awaiting payment confirmation. Finance releases an order for picking.
                </p>
              )}

              {!onHold && (
                <p className="card-panel__note">
                  {order.released_at
                    ? `Released ${new Date(order.released_at).toLocaleDateString()}`
                    : 'Not yet released.'}
                </p>
              )}

              {shipped && mayReceive && (
                /*
                  The step that turns Shipped into Completed. Only the school
                  can take it: shipped means it left the warehouse, completed
                  means it got there, and a warehouse confirming its own
                  delivery arrived closes exactly the gap the step exists to
                  open. A parcel that left three weeks ago and never turned up
                  is invisible without it.
                */
                <>
                  <TextField
                    label="Anything wrong? (optional)"
                    value={receiptNotes}
                    onChange={(event) => setReceiptNotes(event.target.value)}
                  />
                  {awaiting.length > 1 && (
                    <label className="field">
                      <span className="field__label">Which parcel arrived</span>
                      <select
                        className="field__control"
                        value={parcel ?? ''}
                        onChange={(event) => setParcel(Number(event.target.value))}
                      >
                        <option value="">Choose a shipment…</option>
                        {awaiting.map((shipment) => (
                          <option key={shipment.id} value={shipment.id}>
                            {shipment.number}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <Button
                    size="lg"
                    disabled={
                      receipt.isPending ||
                      shipments.isLoading ||
                      (awaiting.length > 1 && parcel === null)
                    }
                    onClick={() =>
                      receipt.mutate({
                        shipment: parcel ?? undefined,
                        notes: receiptNotes.trim() || undefined,
                      })
                    }
                  >
                    <PackageCheck size={16} aria-hidden />
                    {receipt.isPending ? 'Confirming…' : 'Confirm Delivery Received'}
                  </Button>
                </>
              )}

              {shipped && !mayReceive && (
                <p className="card-panel__note">
                  In transit. The order completes when the school confirms it arrived.
                </p>
              )}

              {completed && (
                <p className="card-panel__note">
                  Delivered and confirmed by the school. This order is complete.
                </p>
              )}

              <Button
                variant="secondary"
                size="lg"
                disabled={!canSeeSlip || !mayPrint || slips.isFetching}
                title={
                  !mayPrint
                    ? 'Delivery slips are for the warehouse and the leads'
                    : !canSeeSlip
                      ? 'A slip is created when the order ships'
                      : undefined
                }
                onClick={printSlips}
              >
                {slips.isFetching ? <Spinner size={14} /> : <Printer size={16} aria-hidden />}
                Print Delivery Slip
              </Button>

              {picked && mayPick && (
                <>
                  {/*
                    The pick list is the sheet the warehouse ticks off the
                    shelves. It belongs on the order rather than in the
                    backlog row: a clerk prints it while looking at what they
                    are about to pull.
                  */}
                  <Button variant="secondary" size="lg" onClick={() => window.print()}>
                    <Printer size={16} aria-hidden />
                    Print Pick List
                  </Button>

                  {/*
                    The way back from a mistaken pick. Posts the offsetting
                    ledger pair rather than deleting anything, so the history
                    reads as picked, then put back, by whom and why.
                  */}
                  <ConfirmButton
                    variant="danger-outline"
                    confirmVariant="danger"
                    size="lg"
                    askReason
                    title="Undo this pick?"
                    reasonLabel="Why is it going back?"
                    confirmLabel="Put it back"
                    pendingLabel="Undoing…"
                    pending={unpick.isPending}
                    note="Returns the stock to the shelf and puts the order back in the picking queue. The ledger keeps both entries."
                    onConfirm={(why) => unpick.mutate({ orderId: id, reason: why })}
                  >
                    <Undo2 size={16} aria-hidden />
                    Undo Pick
                  </ConfirmButton>
                </>
              )}
            </div>

            {canCancelNow && (
              <>
                <hr className="card-panel__rule" />
                {/*
                  The shared two-step, not a hand-rolled one. This screen is
                  where the pattern started; picking and despatch grew their
                  own copies of it, so it now lives in one component.
                */}
                <ConfirmButton
                  variant="danger-outline"
                  confirmVariant="danger"
                  askReason
                  title={`Cancel ${order.number}?`}
                  reasonLabel="Why is it being cancelled?"
                  confirmLabel="Confirm cancellation"
                  pendingLabel="Cancelling…"
                  pending={cancel.isPending}
                  note="The invoice becomes void. Nothing is deleted — the school has given this number to a parent."
                  onConfirm={(why) => cancel.mutate(why)}
                >
                  Cancel Order
                </ConfirmButton>
              </>
            )}
          </section>

          <section className="card-panel">
            <h2 className="card-panel__title">Receipt Ledger</h2>

            <dl className="ledger-lines">
              <div>
                {/* No separate invoice series — the order number is it. */}
                <dt>Invoice Number</dt>
                <dd>{order.number}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <Badge tone={paymentTone(order)}>{paymentLabel(order)}</Badge>
                </dd>
              </div>
              <div>
                <dt>Reconciliation Date</dt>
                <dd>
                  {order.released_at
                    ? new Date(order.released_at).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
            </dl>

            <hr className="card-panel__rule" />

            <div className="total-line">
              <span>Total Collected</span>
              {/* The total the server computed, at the prices snapshotted
                  when the order was placed. */}
              <strong>{formatUGX(order.total)}</strong>
            </div>
          </section>
        </div>
      </div>

      {/* Hidden on screen, revealed by the print stylesheet. */}
      {slips.data && slips.data.length > 0 && <PackingListDocument lists={slips.data} />}
    </AppShell>
  )
}
