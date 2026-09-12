/**
 * The tab strip that switches between views of one destination.
 *
 * Shared because there were already two class systems for this — `.tabs`
 * and `.tabbar` — and only one of them was used. A third hand-rolled copy
 * on the shipping screen is how a design system stops being one.
 *
 * For views of the same thing, not navigation between different things.
 * Orders uses it for All / Pending / In Progress / Completed; shipping uses
 * it for the picking queue and what has already gone out.
 */

import type { ReactNode } from 'react'

export interface Tab {
  /** Stable identity — not the index, so reordering tabs cannot mis-select. */
  key: string
  label: ReactNode
}

interface TabBarProps {
  tabs: readonly Tab[]
  active: string
  onSelect: (key: string) => void
  /** Names the strip for a screen reader — "Order groupings". */
  label: string
}

export function TabBar({ tabs, active, onSelect, label }: TabBarProps) {
  return (
    <div className="tabbar" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          className={`tabbar__tab${tab.key === active ? ' tabbar__tab--active' : ''}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
