/**
 * One school, for the detail screen.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'
import { keys } from '@/api/keys'

export function useSchool(id: number) {
  const { data, isLoading, isError } = useQuery({
    queryKey: keys.school(id),
    queryFn: () => catalogApi.school(id),
  })

  return { school: data ?? null, isLoading, isError }
}
