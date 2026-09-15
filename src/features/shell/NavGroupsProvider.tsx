/**
 * Owns which navigation group is open, for the life of the session.
 *
 * An accordion: one group at a time. Clicking another header moves the open
 * one, and clicking the open header closes it so the rail can be fully
 * collapsed.
 *
 * ---------------------------------------------------------------------------
 * Why the current route opens its own group
 * ---------------------------------------------------------------------------
 * Overview alone used to start open, which meant landing anywhere else —
 * following a link, reloading on /adjustments, coming back to a bookmark —
 * drew a sidebar with the current destination hidden inside a collapsed
 * group and nothing highlighted anywhere. The reader is on a page the
 * navigation does not admit exists.
 *
 * So the open group follows the route, and a group the reader opens by hand
 * stays open until they navigate somewhere outside it. Overview is still the
 * fallback for a path that belongs to no group.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { groupForPath } from './navigation'
import { NavGroupsContext, type NavGroupsState } from './NavGroupsContext'

const OPEN_BY_DEFAULT = 'Overview'

export function NavGroupsProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [openLabel, setOpenLabel] = useState<string | null>(
    () => groupForPath(pathname) ?? OPEN_BY_DEFAULT,
  )
  const [lastPath, setLastPath] = useState(pathname)

  /*
    Adjusted during render rather than in an effect. The open group is
    derived from where the reader is, so an effect would render the wrong
    sidebar first and correct it immediately afterwards — and would also
    fight the reader collapsing a group, because it runs on every render
    rather than only when the route actually changed.
  */
  if (pathname !== lastPath) {
    setLastPath(pathname)
    const owner = groupForPath(pathname)
    // Navigating within the open group must not re-open one just collapsed.
    if (owner && owner !== openLabel) setOpenLabel(owner)
  }

  const isOpen = useCallback((label: string) => openLabel === label, [openLabel])

  const toggle = useCallback((label: string) => {
    setOpenLabel((current) => (current === label ? null : label))
  }, [])

  const value = useMemo<NavGroupsState>(() => ({ isOpen, toggle }), [isOpen, toggle])

  return <NavGroupsContext.Provider value={value}>{children}</NavGroupsContext.Provider>
}
