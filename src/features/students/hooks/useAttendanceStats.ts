'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface MonthlyData {
  month: string
  count: number
}

interface StudentAttendance {
  studentName: string
  total: number
  thisMonth: number
}

interface AttendanceStats {
  monthly: MonthlyData[]
  byStudent: StudentAttendance[]
  summary: {
    totalThisMonth: number
    activeStudents: number
    totalStudents: number
  }
}

export function useAttendanceStats(year: number, month: number) {
  return useQuery({
    queryKey: ['attendance-stats', year, month],
    queryFn: async (): Promise<AttendanceStats> => {
      const supabase = createClient()

      // 이번 달 범위
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`

      // 6개월 전
      const sixMonthsAgo = new Date(year, month - 7, 1).toISOString()

      // 1. 최근 6개월 출석 데이터 (월별 추이)
      const { data: recentAttendances } = await supabase
        .from('attendances')
        .select('attended_at')
        .gte('attended_at', sixMonthsAgo)
        .lt('attended_at', endOfMonth)

      const monthly: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const m = new Date(year, month - 1 - i, 1)
        const label = `${m.getMonth() + 1}월`
        const mStart = new Date(m.getFullYear(), m.getMonth(), 1)
        const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1)
        const count = (recentAttendances ?? []).filter((a) => {
          const d = new Date(a.attended_at)
          return d >= mStart && d < mEnd
        }).length
        monthly.push({ month: label, count })
      }

      // 2. 이번 달 수강생별 출석
      const { data: thisMonthData } = await supabase
        .from('attendances')
        .select('student_id, attended_at, student:students(name)')
        .gte('attended_at', startOfMonth)
        .lt('attended_at', endOfMonth)

      const studentMap = new Map<string, { name: string; count: number }>()
      for (const att of thisMonthData ?? []) {
        const name = (att.student as unknown as { name: string })?.name ?? '알 수 없음'
        const existing = studentMap.get(att.student_id) ?? { name, count: 0 }
        existing.count++
        studentMap.set(att.student_id, existing)
      }

      // 3. 전체 학생 수
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      const byStudent: StudentAttendance[] = Array.from(studentMap.entries())
        .map(([, v]) => ({ studentName: v.name, total: v.count, thisMonth: v.count }))
        .sort((a, b) => b.thisMonth - a.thisMonth)

      return {
        monthly,
        byStudent,
        summary: {
          totalThisMonth: thisMonthData?.length ?? 0,
          activeStudents: studentMap.size,
          totalStudents: totalStudents ?? 0,
        },
      }
    },
  })
}
