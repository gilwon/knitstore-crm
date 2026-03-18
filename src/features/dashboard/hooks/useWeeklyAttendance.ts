'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchTodayAttendance } from '../queries'

export function useTodayAttendance() {
  return useQuery({
    queryKey: ['dashboard', 'today-attendance'],
    queryFn: fetchTodayAttendance,
    staleTime: 60_000,
  })
}
