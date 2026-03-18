'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardKPI } from '../queries'

export function useDashboardKPI() {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: fetchDashboardKPI,
    staleTime: 60_000, // 1분
  })
}
