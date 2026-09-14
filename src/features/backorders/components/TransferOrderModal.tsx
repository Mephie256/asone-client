/**
 * Hand a held order to a warehouse that has the stock — F45.
 *
 * ---------------------------------------------------------------------------
 * The dropdown is not a list of warehouses
 * ---------------------------------------------------------------------------
 * It is the list of warehouses that hold enough of **every** line to finish
 * this order, which the server works out. A clerk cannot see another site's
 * shelves, so a free choice is how an order gets sent somewhere empty — and
 * a target that would itself come up short only moves the waiting.
 *
 * Empty means nobody can fill it yet. That is an answer, not a failure, and
 * it reads as one: the next step is production, not a transfer.
 *
 * ---------------------------------------------------------------------------
 * What actually changes
 * ---------------------------------------------------------------------------
 * Responsibility, and nothing else. No stock is reserved at either end; the
 * receiving warehouse picks in the ordinary way afterwards and that pick is
 * what touches inventory. The school keeps its primary warehouse — a
 * transfer moves one order, never the relationship — and the goods go
 * straight to the school rather than back through the warehouse that ran
 * short.
 *
 * All three are stated in the dialogue, because all three are surprising.
 */

import { useEffect, useState } from 'react'
import { Alert, Button, Modal, Spinner } from '@/components'
import { toApiError } from '@/api/errors'
import { formatQuantity } from '@/domain/money'
import { useTransferCandidates, useTransferOrder } from '../hooks/useBackorders'
import type { OrderAwaitingStock } from '@/api/backorders'

interface TransferOrderModalProps {
  entry: OrderAwaitingStock | null
  onClose: () => void
}

export function TransferOrderModal({ entry, onClose }: TransferOrderModalProps) {
  const orderId = entry?.order.id ?? null
  const candidates = useTransferCandidates(orderId)
  const transfer = useTransferOrder()

  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  // Reset between orders: a warehouse chosen for the last one is not a
  // choice anybody made about this one.
  useEffect(() => {
    setWarehouseId(null)
    setReason('')
    transfer.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  if (!entry) return null

  const options = candidates.data ?? []
  const nowhere = candidates.isSuccess && options.length === 0
  const chosen = options.find((option) => option.id === warehouseId)

  return (
    <Modal
      open
      size="md"
      title={`Transfer ${entry.order.number}`}
      subtitle={`${entry.order.school_name} · currently ${entry.order.warehouse_name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={transfer.isPending}>
            Cancel
          </Button>
          <Button
            disabled={warehouseId === null || transfer.isPending}
            onClick={() =>
              transfer.mutate(
                { orderId: entry.order.id, warehouseId: warehouseId as number, reason },
                { onSuccess: onClose },
              )
            }
          >
            {transfer.isPending ? 'Transferring…' : 'Transfer the order'}
          </Button>
        </>
      }
    >
      {/*
        Why this order is here, before what to do about it. The clerk is
        deciding between waiting for the next delivery and moving the order,
        and the shortfall is the whole of that decision.
      */}
      <div className="table-scroll">
        <table className="ledger">
          <thead>
            <tr>
              <th>Waiting on</th>
              <th className="ledger__num">Needed</th>
              <th className="ledger__num">Here</th>
              <th className="ledger__num">Short</th>
            </tr>
          </thead>
          <tbody>
            {entry.waiting_on.map((row) => (
              <tr key={row.sku}>
                <td>
                  <span className="ledger__code">{row.sku}</span>
                  <span className="line-note">{row.description}</span>
                </td>
                <td className="ledger__num t-numeric">{formatQuantity(row.needed)}</td>
                <td className="ledger__num t-numeric">{formatQuantity(row.available)}</td>
                <td className="ledger__num t-numeric ledger__num--owed">
                  {formatQuantity(row.shortfall)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {candidates.isLoading && (
        <p className="field__hint">
          <Spinner size={14} /> Checking which warehouses could fill it…
        </p>
      )}

      {candidates.isError && (
        <Alert tone="error">
          The shortlist could not be loaded, so there is nothing safe to choose
          from. Try again in a moment.
        </Alert>
      )}

      {nowhere && (
        /*
          Not an empty dropdown. Nothing can be transferred, so the answer is
          to have more made rather than to move what does not exist.
        */
        <Alert tone="warning">
          <strong>No warehouse can fill this yet.</strong> Every site is short
          of at least one line, so a transfer would only move the waiting. This
          order is waiting on the Tailoring Centers.
        </Alert>
      )}

      {options.length > 0 && (
        <>
          <div className="field field--stacked">
            <label htmlFor="transfer-warehouse">Transfer to</label>
            <select
              id="transfer-warehouse"
              className="input"
              value={warehouseId ?? ''}
              onChange={(event) =>
                setWarehouseId(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Choose a warehouse…</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="field__hint">
              Only warehouses holding enough of every line are listed. A site
              that could fill some of it would leave the order waiting in a
              second place.
            </p>
          </div>

          <div className="field field--stacked">
            <label htmlFor="transfer-reason">Reason</label>
            <textarea
              id="transfer-reason"
              className="input input--area"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Namayemba out of shirts until the next TC delivery."
            />
            <p className="field__hint">
              Optional, and worth writing: a transfer is somebody's judgement,
              not something the system decided.
            </p>
          </div>
        </>
      )}

      {chosen && (
        <Alert tone="info">
          <strong>{chosen.name}</strong> becomes responsible for{' '}
          {entry.order.number} and ships it straight to {entry.order.school_name}.
          No stock moves anywhere until {chosen.name} picks it, and{' '}
          {entry.order.school_name} still orders from{' '}
          {entry.order.warehouse_name} as before.
        </Alert>
      )}

      {/*
        The server's refusals are written for a person and carry the numbers
        that matter — "Serere cannot fill SO-20014 either: 100016 (needs 5,
        has 2)". Rendered as sent; a generic message would throw away the
        useful half.
      */}
      {transfer.isError && (
        <Alert tone="error">
          <strong>Nothing was transferred.</strong> {toApiError(transfer.error).message}
        </Alert>
      )}
    </Modal>
  )
}
