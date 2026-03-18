'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchWeeklySales } from '../queries'

export function useWeeklySalesChart() {
  return useQuery({
    queryKey: ['dashboard', 'weekly-sales'],
    queryFn: fetchWeeklySales,
    staleTime: 60_000,
  })
}
