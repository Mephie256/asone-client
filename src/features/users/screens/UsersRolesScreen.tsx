/**
 * Users & Roles.
 *
 * Three tabs — Users, Roles, Permissions — sharing one page head and one
 * "+ Add User" action. Gated on `table_updates`, same as the nav entry: only
 * Program Lead and Operations Manager reach this screen at all, so there is
 * no further per-control hiding here.
 */

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components'
import { AppShell } from '@/features/shell/components/AppShell'
import { AddUserModal } from '../components/AddUserModal'
import { PermissionsMatrix } from '../components/PermissionsMatrix'
import { UsersTable } from '../components/UsersTable'
import { useRoles } from '../hooks/useRoles'
import { useCreateUser, useUsers } from '../hooks/useUsers'

const TABS = ['Users', 'Roles', 'Permissions'] as const
type Tab = (typeof TABS)[number]

export function UsersRolesScreen() {
  const [tab, setTab] = useState<Tab>('Users')
  const [modalOpen, setModalOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const usersQuery = useUsers()
  const rolesQuery = useRoles()
  const createUser = useCreateUser()

  const users = usersQuery.data?.results ?? []
  const roles = rolesQuery.data ?? []

  return (
    <AppShell title="Users & Roles">
      <header className="page-head page-head--split">
        <div>
          <h1 className="page-head__title">Users & Roles</h1>
          <p className="page-head__subtitle">
            Manage staff accounts, their roles, and what each role may do.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <UserPlus size={16} aria-hidden />
          Add User
        </Button>
      </header>

      <div className="tabbar" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry}
            type="button"
            role="tab"
            aria-selected={entry === tab}
            className={`tabbar__tab${entry === tab ? ' tabbar__tab--active' : ''}`}
            onClick={() => setTab(entry)}
          >
            {entry}
          </button>
        ))}
      </div>

      {justAdded && (
        <div className="alert alert--success" role="status">
          User added successfully
        </div>
      )}

      {tab === 'Users' && (
        <div className="table-card" aria-busy={usersQuery.isFetching || undefined}>
          <UsersTable users={users} loading={usersQuery.isLoading} />
        </div>
      )}

      {(tab === 'Roles' || tab === 'Permissions') && (
        <div className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Role Permissions Matrix Preview</h2>
          </header>
          <p className="panel__subtitle">System functions authorized by user role profiles.</p>
          <div className="panel__body">
            <PermissionsMatrix roles={roles} loading={rolesQuery.isLoading} />
          </div>
        </div>
      )}

      {modalOpen && (
        <AddUserModal
          roles={roles}
          onClose={() => setModalOpen(false)}
          onCreate={async (input) => {
            const created = await createUser.mutateAsync(input)
            setJustAdded(true)
            setTimeout(() => setJustAdded(false), 4000)
            return created
          }}
        />
      )}
    </AppShell>
  )
}
