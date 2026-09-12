/**
 * Create or update a school.
 *
 * One hook for both: the form is the same either way, and the only
 * difference is which HTTP verb goes out.
 *
 * `meta.silent` opts this mutation out of the query client's global failure
 * snackbar (`api/queryClient.ts`) — the form renders the same error inline,
 * next to the field it belongs to, and showing it twice is worse than once.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'
import type { SchoolInput } from '@/api/catalog'
import { snackbar } from '@/components'

export function useSaveSchool(id?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SchoolInput) =>
      id ? catalogApi.updateSchool(id, input) : catalogApi.createSchool(input),
    meta: { silent: true },
    onSuccess: (school) => {
      // Broad on purpose: 'schools' is the prefix of both the list key and
      // this one school's detail key (see api/keys.ts), so one invalidation
      // covers whichever screen someone lands back on.
      void queryClient.invalidateQueries({ queryKey: ['schools'] })
      snackbar.success(id ? `${school.name} updated` : `${school.name} added`)
    },
  })
}
