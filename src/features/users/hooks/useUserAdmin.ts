/**
 * One account, and the things a lead can do to it.
 *
 * All five actions already existed on the server and none had a screen: a
 * forgotten password meant somebody editing the database. That is the gap
 * this fills.
 *
 * Every mutation invalidates the list as well as the row, because the list
 * is what the lead came from and it shows the same status, site and role
 * this screen changes.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '@/api/users'
import { snackbar } from '@/components'
import type { UserAdmin } from '@/api/types'

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => usersApi.retrieve(id),
    enabled: Number.isFinite(id),
  })
}

/** Both the row and the list it came from. */
function invalidate(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  void queryClient.invalidateQueries({ queryKey: ['users', 'detail', id] })
  void queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<UserAdmin>) => usersApi.update(id, input),
    onSuccess: (user) => {
      invalidate(queryClient, id)
      snackbar.success(`${user.first_name} ${user.last_name} saved`.trim())
    },
  })
}

/**
 * Set someone else's password for them — the reason this screen exists.
 *
 * Returns the new password **once**. It is never emailed, so the screen has
 * to show it and say plainly that it will not be shown again; losing it here
 * means doing this a second time.
 *
 * It also signs that account out everywhere, which is right — a password
 * being reset usually means it is not trusted any more — but it is the kind
 * of thing to be told before pressing, not after.
 */
export function useSetPassword(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newPassword?: string) =>
      usersApi.setPassword(id, newPassword ? { new_password: newPassword } : undefined),
    onSuccess: () => invalidate(queryClient, id),
  })
}

export function useSetActive(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (active: boolean) =>
      active ? usersApi.activate(id) : usersApi.deactivate(id),
    onSuccess: (user) => {
      invalidate(queryClient, id)
      snackbar.success(
        user.is_active ? 'Account reactivated' : 'Account deactivated',
        user.is_active
          ? 'They can sign in again.'
          : 'They can no longer sign in. Everything they have done is untouched.',
      )
    },
  })
}

/**
 * Drop every session without changing the password.
 *
 * The lighter of the two: for a laptop left signed in somewhere, where the
 * password is still trusted and only the open sessions are the problem.
 */
export function useSignOutEverywhere(id: number) {
  return useMutation({
    mutationFn: () => usersApi.signOut(id),
    onSuccess: () =>
      snackbar.success(
        'Signed out everywhere',
        'Every device is dropped. Their password is unchanged, so they can sign back in.',
      ),
  })
}
