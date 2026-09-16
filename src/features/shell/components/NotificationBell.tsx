/**
 * The notification bell — Figma 2001:788.
 *
 * Reads `/dashboard/notifications/`, the same source the Needs Attention
 * panel uses, so the badge and the panel can never disagree about the same
 * problem.
 *
 * The badge appears only when there is something unread — the design draws a
 * permanent "4", but a count of nothing should not be a red dot.
 *
 * Opening it shows the messages the server already wrote. It is a disclosure
 * rather than a route because notifications span several areas and there is
 * no single screen they all belong to.
 */

import { Bell, CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertPath, alertTone } from '@/domain/status'
import { useNotifications } from '../hooks/useNotifications'

export function NotificationBell() {
  const { unreadCount, items, isLoading } = useNotifications()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close on an outside click or Escape — a panel that traps you inside it
  // is worse than one that is a click away.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    /*
      `globalThis.KeyboardEvent`, not the `KeyboardEvent` imported from React
      above. That import is React's synthetic event — right for the JSX
      handler further down, wrong for `document.addEventListener`, which
      hands out the DOM one. The two are different types with the same name,
      and the file's own import was shadowing the one this line needs, so
      `tsc -b` refused to build.
    */
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const label =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications, none unread'

  return (
    <div className="bell" ref={container}>
      <button
        type="button"
        className="topbar__icon-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((shown) => !shown)}
      >
        <Bell size={18} aria-hidden />
        {unreadCount > 0 && <span className="topbar__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="bell__panel" role="dialog" aria-label="Notifications">
          {/* The count belongs in the pinned heading: once the list scrolls,
              it is the only place that can say how much there is. */}
          <p className="bell__title">
            Notifications
            {items.length > 0 && <span className="bell__count">{items.length}</span>}
          </p>

          {isLoading ? (
            <p className="bell__empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="bell__empty">
              <CheckCircle2 size={16} aria-hidden />
              Nothing needs your attention.
            </p>
          ) : (
            <ul className="bell__list">
              {items.map((item) => {
                const to = alertPath(item.kind, item.ref_id)
                return (
                  <li
                    className={`bell__item${to ? ' bell__item--clickable' : ''}`}
                    key={`${item.kind}-${item.message}`}
                    {...(to
                      ? {
                          role: 'button',
                          tabIndex: 0,
                          onClick: () => {
                            setOpen(false)
                            navigate(to)
                          },
                          onKeyDown: (event: KeyboardEvent) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setOpen(false)
                              navigate(to)
                            }
                          },
                        }
                      : {})}
                  >
                    <span className={`bell__level bell__level--${alertTone(item.level)}`}>
                      {item.level}
                    </span>
                    <span className="bell__message">{item.message}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
