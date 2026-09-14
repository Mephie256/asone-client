/**
 * The Users tab's data: the staff list, and creating a new account.
 *
 * `page_size` is left at the server default rather than fixed here, unlike
 * `useOrders` — the Users list is small enough (tens, not hundreds) that
 * paging it the way the order ledger does would be premature.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '@/api/users'
import type { CreatedUser } from '@/api/users'
import type { UserCreate } from '@/api/types'

export function useUsers() {
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.list(),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation<CreatedUser, unknown, UserCreate>({
    mutationFn: (input) => usersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
  })
}
