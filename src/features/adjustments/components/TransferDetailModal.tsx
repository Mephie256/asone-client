/**
 * One warehouse transfer, in full — its lines, its note, and what state it is
 * in.
 *
 * The same reasoning as the adjustment dialog: nothing here is editable, so a
 * detail route would be a URL full of read-only facts. What the table cannot
 * show is the line breakdown and the dispatch note, and both matter to
 * whoever is about to commit it.
 *
 * **Prepared is not a waiting room.** There is no approval step in the server
 * and no second role: AsOne's matrix guards preparing and posting with one
 * cell, so whoever prepared it may post it. Who signs off a large movement is
 * their open question Q10, and inventing an approver here would be inventing
 * a control the client has not asked for.
 */

import { Alert, Badge, ConfirmButton, Modal } from '@/components'
import { toApiError } from '@/api/errors'
import { formatDay } from '@/domain/dates'
import { formatQuantity } from '@/domain/money'
import { usePostDraftTransfer } from '../hooks/useAdjustments'
import type { WarehouseTransfer } from '@/api/types'

interface TransferDetailModalProps {
  transfer: WarehouseTransfer | null
  onClose: () => void
}

export function TransferDetailModal({ transfer, onClose }: TransferDetailModalProps) {
  const post = usePostDraftTransfer()

  if (!transfer) return null

  const units = transfer.lines.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <Modal
      open
      size="lg"
      title={transfer.number}
      subtitle={`${transfer.from_warehouse_name} → ${transfer.to_warehouse_name}`}
      onClose={onClose}
      footer={
        transfer.is_posted ? undefined : (
          <ConfirmButton
            confirmLabel="Yes, move the stock"
            title={`Post ${transfer.number}`}
            pendingLabel="Posting…"
            pending={post.isPending}
            note={`Moves ${units} units out of ${transfer.from_warehouse_name} and into ${transfer.to_warehouse_name}. Both halves are written in one transaction and cannot be undone.`}
            onConfirm={() => post.mutate(transfer.id, { onSuccess: onClose })}
          >
            Post to the ledger
          </ConfirmButton>
        )
      }
    >
      {!transfer.is_posted && (
        <Alert tone="warning">
          <strong>Prepared, not posted.</strong> Nothing has moved — the stock is
          still at {transfer.from_warehouse_name}. Posting is what moves it, and
          whoever prepared this may do it; there is no separate approval step.
        </Alert>
      )}

      {post.isError && (
        <Alert tone="error">
          <strong>Nothing was moved.</strong> {toApiError(post.error).message}
        </Alert>
      )}

      <dl className="detail-list">
        <div>
          <dt>Status</dt>
          <dd>
            <Badge tone={transfer.is_posted ? 'success' : 'warning'}>
              {transfer.is_posted ? 'POSTED' : 'PREPARED'}
            </Badge>
          </dd>
        </div>

        <div>
          <dt>Date of move</dt>
          <dd>{formatDay(transfer.transfer_date)}</dd>
        </div>

        <div>
          <dt>Source</dt>
          <dd>{transfer.from_warehouse_name}</dd>
        </div>

        <div>
          <dt>Destination</dt>
          <dd>{transfer.to_warehouse_name}</dd>
        </div>

        <div>
          <dt>Reason</dt>
          <dd>{transfer.reason_code_name || <span className="detail-list__muted">None given</span>}</dd>
        </div>

        <div>
          <dt>Raised by</dt>
          <dd>{transfer.created_by_name}</dd>
        </div>
      </dl>

      {/*
        The dialog never grows past the viewport: `.modal` is capped and
        `.modal__body` scrolls between a pinned head and footer, so a transfer
        with thirty lines scrolls rather than running off the screen. What a
        long list still needs is a heading that says how long it is, before
        anyone starts scrolling, and a table header that stays put once they
        do — see `.modal__body .ledger thead th`.
      */}
      <h3 className="detail-notes__title">
        {transfer.lines.length} {transfer.lines.length === 1 ? 'item' : 'items'} ·{' '}
        {formatQuantity(units)} units
      </h3>

      <div className="table-scroll">
        <table className="ledger">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th className="ledger__num">Qty</th>
            </tr>
          </thead>
          <tbody>
            {transfer.lines.map((line) => (
              <tr key={line.id}>
                <td className="ledger__code">{line.sku_number}</td>
                <td className="ledger__wrap">{line.sku_description}</td>
                <td className="ledger__num t-numeric">{formatQuantity(line.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Total</td>
              <td className="ledger__num t-numeric">{formatQuantity(units)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Deliberately stated rather than left to be inferred: a movement of
          stock that changes no money is the surprising part of F25. */}
      <p className="field__hint">
        Value is unchanged. AsOne owns the stock at either site, so posting
        writes both rows at the same unit value.
      </p>

      {transfer.notes?.trim() && (
        <div className="detail-notes">
          <h3 className="detail-notes__title">Dispatch instructions</h3>
          <p className="detail-notes__body">{transfer.notes}</p>
        </div>
      )}
    </Modal>
  )
}
