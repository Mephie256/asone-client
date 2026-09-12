/**
 * A button that asks before doing something it cannot take back.
 *
 * One component, because this system has several irreversible actions and
 * they were each growing their own two-step: cancelling an order, picking
 * stock, despatching a van.
 *
 * **It asks in a dialog, not in place.** The first version swapped the
 * button for a confirm-and-cancel pair where it stood, which is fine in a
 * side panel and wrong in a table row — the row grew, every column shifted,
 * and the thing being confirmed moved while you were reading it. A dialog
 * costs nothing and behaves the same wherever it is used.
 *
 * `askReason` is for an action whose *why* is worth keeping. Undoing a pick
 * is one: somebody will want to know why the stock went back.
 */

import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { TextField } from './TextField'

interface ConfirmButtonProps {
  /** The resting label — "Start Pick", "Cancel Order". */
  children: ReactNode
  /** The dialog's heading. Defaults to the resting label. */
  title?: string
  /** The label on the confirming button — "Yes, pick it". */
  confirmLabel: string
  pendingLabel?: string
  /** `reason` is empty unless `askReason`. */
  onConfirm: (reason: string) => void
  pending?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost'
  confirmVariant?: 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  askReason?: boolean
  reasonLabel?: string
  /** What confirming will do. Shown in the dialog body. */
  note?: string
  buttonTitle?: string
}

export function ConfirmButton({
  children,
  title,
  confirmLabel,
  pendingLabel,
  onConfirm,
  pending = false,
  disabled = false,
  variant = 'primary',
  confirmVariant = 'primary',
  size = 'md',
  askReason = false,
  reasonLabel = 'Reason',
  note,
  buttonTitle,
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')

  function close() {
    setAsking(false)
    setReason('')
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || pending}
        title={buttonTitle}
        onClick={() => setAsking(true)}
      >
        {pending && pendingLabel ? pendingLabel : children}
      </Button>

      <Modal
        open={asking}
        title={title ?? confirmLabel}
        onClose={close}
        footer={
          <div className="modal__foot-actions">
            <Button variant="secondary" onClick={close} disabled={pending}>
              Keep as is
            </Button>
            <Button
              variant={confirmVariant}
              disabled={pending || (askReason && !reason.trim())}
              onClick={() => {
                onConfirm(reason.trim())
                close()
              }}
            >
              {pending ? (pendingLabel ?? 'Working…') : confirmLabel}
            </Button>
          </div>
        }
      >
        {note && <p className="confirm__note">{note}</p>}

        {askReason && (
          <TextField
            label={reasonLabel}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </Modal>
    </>
  )
}
