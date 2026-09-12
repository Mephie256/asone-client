/**
 * A modal dialog, on the native `<dialog>` element.
 *
 * Built on `<dialog>` because the platform already does the hard parts and
 * does them better: focus is trapped inside, the rest of the page goes inert
 * to a screen reader, Escape closes it, and the top layer means no stacking
 * context can put something over it.
 *
 * Two behaviours are deliberately overridden. **Escape is intercepted**
 * rather than allowed to close silently, so a half-typed form can ask first.
 * **The backdrop does not close it** — a misplaced click should not discard
 * what somebody was in the middle of.
 */

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  /** A line under the title, for a dialog that needs one. */
  subtitle?: string
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  /** Pinned below the scrolling body. */
  footer?: ReactNode
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  size = 'sm',
  children,
  footer,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  // Unique, so two dialogs mounted at once cannot share an id.
  const titleId = useId()

  /*
   * Opening and closing genuinely has to be an effect: `showModal()` is an
   * imperative call into a DOM node, which is exactly the "synchronise with
   * an external system" an effect is for.
   */
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: let the owner decide rather than discarding silently.
        event.preventDefault()
        onClose()
      }}
    >
      <header className="modal__head">
        <div>
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          {subtitle && <p className="modal__subtitle">{subtitle}</p>}
        </div>
        <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
          <X size={18} aria-hidden />
        </button>
      </header>

      <div className="modal__body">{children}</div>

      {footer && <footer className="modal__foot">{footer}</footer>}
    </dialog>
  )
}
