/**
 * A button that asks before it does something it cannot take back.
 *
 * One component, because this system has several irreversible actions and
 * they were each growing their own two-step dance: cancelling an order,
 * picking stock, despatching a van. Three inline implementations of the same
 * idea is how a design system stops being one.
 *
 * The shape is the one the order screen already established — the action
 * turns into a confirm-and-cancel pair in place, optionally with a reason
 * field — rather than a dialog. In place is right here: these actions sit in
 * table rows and side panels where a modal would obscure the very row you
 * are confirming.
 *
 * `reason` is for an action whose *why* is worth keeping. Undoing a pick is
 * one: somebody will want to know why the stock went back.
 */

import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { TextField } from './TextField'

interface ConfirmButtonProps {
  /** The resting label — "Start Pick", "Cancel Order". */
  children: ReactNode
  /** The label once it is asking — "Yes, pick it". */
  confirmLabel: string
  /** Shown while the action is running. */
  pendingLabel?: string
  /** What happens when confirmed. `reason` is empty unless `askReason`. */
  onConfirm: (reason: string) => void
  pending?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost'
  /** The variant of the confirm step, when it should read louder. */
  confirmVariant?: 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Ask why, and require it. */
  askReason?: boolean
  reasonLabel?: string
  /** One line explaining what confirming will do. */
  note?: string
  title?: string
}

export function ConfirmButton({
  children,
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
  title,
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')

  if (!asking) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled || pending}
        title={title}
        onClick={() => setAsking(true)}
      >
        {children}
      </Button>
    )
  }

  return (
    <div className="confirm">
      {note && <p className="confirm__note">{note}</p>}

      {askReason && (
        <TextField
          label={reasonLabel}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      )}

      <div className="confirm__actions">
        <Button
          variant={confirmVariant}
          size={size}
          disabled={pending || (askReason && !reason.trim())}
          onClick={() => {
            onConfirm(reason.trim())
            setAsking(false)
            setReason('')
          }}
        >
          {pending ? (pendingLabel ?? 'Working…') : confirmLabel}
        </Button>

        <Button
          variant="ghost"
          size={size}
          disabled={pending}
          onClick={() => {
            setAsking(false)
            setReason('')
          }}
        >
          Keep as is
        </Button>
      </div>
    </div>
  )
}
