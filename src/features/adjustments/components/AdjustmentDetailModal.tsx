/**
 * One adjustment, in full.
 *
 * The table clamps the reason to two lines so a long note cannot turn a row
 * into a paragraph; this is where the rest of it lives, along with everything
 * the table has no column for — who posted it, when it hit the ledger, and
 * what the units were valued at.
 *
 * A dialog rather than a route because there is nothing to do here. An
 * adjustment is never edited and never deleted (F28: a mistake is corrected
 * by posting the opposite entry), so a detail *page* would be a URL whose
 * only content is eight read-only facts.
 *
 * The one exception is a **draft** — an adjustment written down whose posting
 * failed, which has moved no stock and is otherwise a dead end. Posting it is
 * offered here, and nowhere else.
 */

import { Alert, Badge, ConfirmButton, Modal } from '@/components'
import { toApiError } from '@/api/errors'
import { formatDay } from '@/domain/dates'
import { formatQuantity, formatUGX, multiplyMoney } from '@/domain/money'
import { formatSigned, signedQuantity, typeLabel, typeTone } from '@/domain/adjustments'
import { usePostDraftAdjustment } from '../hooks/useAdjustments'
import type { InventoryAdjustment, ReasonCode } from '@/api/types'

interface AdjustmentDetailModalProps {
  adjustment: InventoryAdjustment | null
  /** The codes table, for the direction a quantity does not carry. */
  codes: readonly ReasonCode[]
  onClose: () => void
}

function postedAt(value: string | null): string {
  if (!value) return 'Not posted'
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdjustmentDetailModal({
  adjustment,
  codes,
  onClose,
}: AdjustmentDetailModalProps) {
  const post = usePostDraftAdjustment()

  if (!adjustment) return null

  const signed = signedQuantity(adjustment.quantity, adjustment.reason_code_code, codes)
  const value = adjustment.unit_value
    ? multiplyMoney(adjustment.unit_value, adjustment.quantity)
    : null

  return (
    <Modal
      open
      size="lg"
      title={adjustment.number}
      subtitle={`${adjustment.sku_number} · ${adjustment.warehouse_name}`}
      onClose={onClose}
      footer={
        adjustment.is_posted ? undefined : (
          <ConfirmButton
            confirmLabel="Yes, post it"
            title={`Post ${adjustment.number}`}
            pendingLabel="Posting…"
            pending={post.isPending}
            note={`Writes one permanent ledger row at ${adjustment.warehouse_name}. It cannot be edited or deleted afterwards — a mistake is corrected by posting the opposite entry.`}
            onConfirm={() => post.mutate(adjustment.id, { onSuccess: onClose })}
          >
            Post to the ledger
          </ConfirmButton>
        )
      }
    >
      {!adjustment.is_posted && (
        /*
          The fact that decides whether anyone needs to act. A draft looks
          like history in the table, and reads on every other screen as
          stock that never changed — which is true, and is exactly what is
          worth saying out loud.
        */
        <Alert tone="warning">
          <strong>Written down, not posted.</strong> No stock has moved, and this
          adjustment is not in the ledger. Posting is what commits it.
        </Alert>
      )}

      {post.isError && (
        <Alert tone="error">
          <strong>Nothing was posted.</strong> {toApiError(post.error).message}
        </Alert>
      )}

      <dl className="detail-list">
        <div>
          <dt>Type</dt>
          <dd>
            <Badge tone={typeTone(adjustment.reason_code_code)}>
              {typeLabel(adjustment.reason_code_code)}
            </Badge>
          </dd>
        </div>

        <div>
          <dt>Quantity</dt>
          <dd className="t-numeric">
            {signed === null ? formatQuantity(adjustment.quantity) : formatSigned(signed)} units
          </dd>
        </div>

        <div>
          <dt>Item</dt>
          <dd>
            {adjustment.sku_number} — {adjustment.sku_description}
          </dd>
        </div>

        <div>
          <dt>Warehouse</dt>
          <dd>{adjustment.warehouse_name}</dd>
        </div>

        <div>
          <dt>Date of change</dt>
          <dd>{formatDay(adjustment.adjustment_date)}</dd>
        </div>

        <div>
          <dt>Reason code</dt>
          <dd>
            {adjustment.reason_code_name}{' '}
            <span className="detail-list__muted">({adjustment.reason_code_code})</span>
          </dd>
        </div>

        <div>
          <dt>Unit value</dt>
          <dd className="t-numeric">
            {/* Set at posting, from the price list in force on the date of
                change — so a draft has none yet, and says so. */}
            {adjustment.unit_value ? formatUGX(adjustment.unit_value) : 'Set when posted'}
          </dd>
        </div>

        <div>
          <dt>Value of the change</dt>
          <dd className="t-numeric">{value ? formatUGX(value) : '—'}</dd>
        </div>

        <div>
          <dt>Raised by</dt>
          <dd>{adjustment.created_by_name}</dd>
        </div>

        <div>
          <dt>Posted</dt>
          <dd>{postedAt(adjustment.posted_at)}</dd>
        </div>
      </dl>

      <div className="detail-notes">
        <h3 className="detail-notes__title">Notes &amp; observations</h3>
        <p className="detail-notes__body">
          {adjustment.notes?.trim() ? (
            adjustment.notes
          ) : (
            <span className="detail-list__muted">
              Nothing was written down. The reason code is all this row records.
            </span>
          )}
        </p>
      </div>
    </Modal>
  )
}
