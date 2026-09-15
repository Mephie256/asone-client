/**
 * Pending registration requests — the Needs Attention notification's
 * destination, and the data behind the Approve/Decline popup.
 *
 * Approving or declining changes the Needs Attention count as well as the
 * request list and the Users table, so all three are invalidated together —
 * the same reasoning `useCreateUser` already follows for the users list.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as registrationsApi from '@/api/registrations'
import type { ApprovedRegistration } from '@/api/registrations'

export function usePendingRegistrations() {
  return useQuery({
    queryKey: ['registration-requests', 'PENDING'],
    queryFn: () => registrationsApi.list({ status: 'PENDING' }),
  })
}

function useInvalidateAfterDecision() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['registration-requests'] })
    void queryClient.invalidateQueries({ queryKey: ['users'] })
    // Both read the same server-side count this request is part of — see
    // dashboard/services.py::needs_attention.
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'attention'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] })
  }
}

export function useApproveRegistration() {
  const onDecided = useInvalidateAfterDecision()
  return useMutation<
    ApprovedRegistration,
    unknown,
    { id: number; role: string; warehouse?: number; school?: number }
  >({
    mutationFn: ({ id, ...body }) => registrationsApi.approve(id, body),
    onSuccess: onDecided,
  })
}

export function useDeclineRegistration() {
  const onDecided = useInvalidateAfterDecision()
  return useMutation<unknown, unknown, { id: number; notes?: string }>({
    mutationFn: ({ id, notes }) => registrationsApi.decline(id, { notes }),
    onSuccess: onDecided,
  })
}
