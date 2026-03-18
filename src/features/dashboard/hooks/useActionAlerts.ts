'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchActionAlerts } from '../queries'

export function useActionAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: fetchActionAlerts,
    staleTime: 5 * 60_000, // 5분
  })
}
