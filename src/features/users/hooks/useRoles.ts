/**
 * The role catalogue: labels, scope, and the access-matrix columns —
 * shared by the Roles tab, the Permissions tab, and Add User's role picker.
 *
 * Rarely changes, so it is cached for the session rather than refetched on
 * every tab switch.
 */

import { useQuery } from '@tanstack/react-query'
import * as authApi from '@/api/auth'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => authApi.roles(),
    staleTime: 10 * 60 * 1000,
  })
}
