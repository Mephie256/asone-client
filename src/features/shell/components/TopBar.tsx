/**
 * The top bar — Figma 2001:765.
 *
 * Three things in the design are deliberately not built here:
 *
 *   The "Online · Synced just now" indicator is the offline/sync feature,
 *   which is deferred. Showing a sync state the app does not track would be
 *   a lie on every screen, so it is omitted rather than hardcoded.
 *
 *   Search is inert until `SearchFilter` is added to the server's
 *   DEFAULT_FILTER_BACKENDS — every `search_fields` declaration in the
 *   catalog is currently dead, so the input would return everything.
 */

import { Search } from 'lucide-react'
import { HelpButton } from './HelpButton'
import { NotificationBell } from './NotificationBell'
import { WarehouseSwitcher } from './WarehouseSwitcher'

interface TopBarProps {
  /** The current screen's name, shown as the leading chip. */
  title: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <span className="topbar__chip">{title}</span>

        <WarehouseSwitcher />
      </div>

      <label className="topbar__search">
        <Search size={14} aria-hidden />
        <input type="search" placeholder="Search SKU, school, center…" disabled />
      </label>

      <div className="topbar__actions">
        <NotificationBell />
        <HelpButton />
      </div>
    </header>
  )
}
