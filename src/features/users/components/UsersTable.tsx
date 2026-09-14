/**
 * The Users tab's table — Name, Email, Role, Assigned Site, Status, Last Active.
 *
 * "Last Active" reads `last_login`, which is the closest thing the server
 * tracks — there is no separate presence/activity feed, so this is a sign-in
 * timestamp shown under a friendlier label, not a live "seen 2 minutes ago".
 */

import { Users as UsersIcon } from 'lucide-react'
import { Badge, EmptyState, SkeletonRows } from '@/components'
import type { UserAdmin } from '@/api/types'

interface UsersTableProps {
  users: UserAdmin[]
  loading: boolean
}

function siteFor(user: UserAdmin): string {
  return user.warehouse_name || user.school_name || 'All Sites'
}

/** Relative-ish, matching the design's "2 mins ago" / "3 days ago" style. */
function lastActive(iso: string | null): string {
  if (!iso) return 'Never signed in'

  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function UsersTable({ users, loading }: UsersTableProps) {
  if (loading) return <SkeletonRows rows={8} height="44px" />

  if (users.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="No users yet"
        body="Add the first staff account with the button above."
      />
    )
  }

  return (
    <div className="scroll-x">
      <table className="ledger">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Assigned Site</th>
            <th>Status</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="ledger__strong">
                {`${user.first_name} ${user.last_name}`.trim() || user.email}
              </td>
              <td>{user.email}</td>
              <td>
                <Badge tone="info">{user.role_display}</Badge>
              </td>
              <td>{siteFor(user)}</td>
              <td>
                <span className={`status-dot status-dot--${user.is_active ? 'active' : 'inactive'}`}>
                  <span className="status-dot__mark" aria-hidden />
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{lastActive(user.last_login)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
