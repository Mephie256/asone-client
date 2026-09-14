/**
 * The navigation model.
 *
 * One entry per destination, each declaring which column of AsOne's access
 * matrix it needs. Nothing here branches on a role name, so a change to one
 * cell of that matrix stays a change on the server.
 *
 * ---------------------------------------------------------------------------
 * Why this is a superset, not a copy of the design
 * ---------------------------------------------------------------------------
 * The dashboard frame (Figma 2001:424) draws every item unconditionally, and
 * its user footer reads "Warehouse Lead". Taken literally it belongs to no
 * single role: it contains **Orders**, which is School Staff only, and
 * **Inv. Adjustments**, which the matrix reserves for Finance and denies to
 * both leads. Drawing it as-is would put two guaranteed 403s in a Program
 * Lead's sidebar.
 *
 * So the design is read as the full set of destinations, and each role sees
 * the subset it holds. A Program Lead gets everything here except Orders and
 * Inv. Adjustments; a warehouse clerk gets receiving, shipments, backorders
 * and inventory; a school clerk gets orders and little else.
 *
 * Hiding an item is cosmetic — the server re-checks every request — but a
 * navigation that leads somewhere forbidden is worse than one that is quiet.
 */

import { canReadSchoolOrders } from '@/domain/access'
import type { AccessFunction, CurrentUser } from '@/api/types'

/**
 * What a destination needs.
 *
 *   a column   the usual case — one cell of AsOne's access matrix
 *   a predicate for the few server rules that are not a single column, such
 *              as who may read school orders. It names the rule it mirrors.
 *   null       every signed-in user
 */
export type NavRequirement = AccessFunction | ((user: CurrentUser | null) => boolean) | null

export interface NavItem {
  label: string
  path: string
  /** Which matrix column this needs, or null for everyone. */
  requires: NavRequirement
  /** Lucide icon name, resolved by the sidebar. */
  icon: string
}

export interface NavGroup {
  /** The uppercase section label. Hidden when the group has no visible items. */
  label: string
  items: NavItem[]
}

export const NAVIGATION: readonly NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', requires: null, icon: 'LayoutDashboard' },
      { label: 'Reports', path: '/reports', requires: 'financial_reports', icon: 'FileBarChart' },
    ],
  },
  {
    label: 'Operations',
    items: [
      /*
       * Mirrors the server, which is wider than the matrix column here:
       * writing an order is School Staff only, but reading the list is
       * School Staff plus Finance — see canReadSchoolOrders. Gating on
       * `school_orders` alone hid the screen from Finance, who the server
       * lets in.
       *
       * Warehouse staff are still out: they can act on a single order
       * (pick list, pick, availability) but cannot browse them, so their
       * way in is the dashboard's picking queue, not this tab.
       */
      { label: 'Orders', path: '/orders', requires: canReadSchoolOrders, icon: 'Package' },
      {
        label: 'Receiving',
        path: '/receiving',
        requires: 'warehouse_receiving_and_shipping',
        icon: 'PackageOpen',
      },
      {
        label: 'Shipments',
        path: '/shipments',
        requires: 'warehouse_receiving_and_shipping',
        icon: 'Truck',
      },
      {
        label: 'Production Orders',
        path: '/production-orders',
        requires: 'production_orders',
        icon: 'Receipt',
      },
      // Finance only — the matrix reserves posting adjustments to them, and
      // the server refuses everybody else.
      {
        label: 'Inv. Adjustments',
        path: '/adjustments',
        requires: 'inventory_adjustments',
        icon: 'SlidersHorizontal',
      },
      {
        label: 'Backorders',
        path: '/backorders',
        requires: 'backorder_transfers',
        icon: 'Clock',
      },
    ],
  },
  {
    label: 'Inventory & Products',
    items: [
      // Readable by every role, and the server scopes the rows: a warehouse
      // clerk sees their site, a school sees the warehouse that serves it.
      { label: 'Inventory', path: '/inventory', requires: null, icon: 'Boxes' },

      /*
       * The audit trail — every movement of one SKU, in order. A separate
       * destination from Inventory because they answer different questions:
       * Inventory says how much is there, this says how it got that way.
       * Warehouse staff see their own site; Finance and the leads see all.
       */
      { label: 'Stock History', path: '/stock-history', requires: null, icon: 'History' },

      { label: 'Uniform Kits', path: '/kits', requires: null, icon: 'Shirt' },

      /*
       * Garments, SKUs and pricing had no destination at all until
       * 13 September — not placeholders, simply absent, which made the app
       * look finished while the tables everything else is built on had no
       * way in. A production order needs SKUs; a SKU needs a garment; an
       * order needs a price.
       *
       * Garments are leads-only per F05, which is narrower than SKUs
       * (view-only for everyone) — see open question 6, since a SKU already
       * shows its garment's name.
       */
      { label: 'Garments', path: '/garments', requires: 'table_updates', icon: 'Shirt' },
      { label: 'SKUs', path: '/skus', requires: null, icon: 'Tags' },
      { label: 'Pricing', path: '/pricing', requires: null, icon: 'Coins' },
    ],
  },
  {
    label: 'Locations',
    items: [
      // Master data. Several roles may *read* these tables, but only the
      // Table Updates column may change them, and management is what these
      // screens are for — so the whole group follows that column.
      { label: 'Schools', path: '/schools', requires: 'table_updates', icon: 'School' },
      { label: 'Warehouses', path: '/warehouses', requires: 'table_updates', icon: 'Warehouse' },
      {
        label: 'Tailoring Centers',
        path: '/tailoring-centers',
        requires: 'table_updates',
        icon: 'SewingMachine',
      },
    ],
  },
  {
    label: 'Profile & Account',
    items: [
      // /auth/users/ is Program Lead and Operations Manager only.
      { label: 'Users & Roles', path: '/users', requires: 'table_updates', icon: 'Users' },
      // Your own account — everyone has one.
      { label: 'Settings', path: '/settings', requires: null, icon: 'Settings' },
    ],
  },
]

/** Every item, flattened — for registering routes and looking one up. */
export const ALL_NAV_ITEMS: readonly NavItem[] = NAVIGATION.flatMap((group) => group.items)

/**
 * The nav item a path belongs to, or null for a path outside the menu.
 *
 * Lets a screen name itself from the same model the sidebar draws from,
 * rather than repeating its title in a route table.
 */
export function findNavItem(path: string): NavItem | null {
  return ALL_NAV_ITEMS.find((item) => item.path === path) ?? null
}
