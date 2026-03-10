'use client'

import { CalendarCheck } from 'lucide-react'
import type { StudentWithDetails } from '../types'

interface AttendanceHistoryProps {
  attendances: StudentWithDetails['attendances']
}

export function AttendanceHistory({ attendances }: AttendanceHistoryProps) {
  if (attendances.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <CalendarCheck size={28} className="opacity-30" />
        <p className="text-sm">출석 이력이 없습니다</p>
      </div>
    )
  }

  const sorted = [...attendances].sort(
    (a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime()
  )

  return (
    <div className="divide-y">
      {sorted.map((att) => (
        <div key={att.id} className="flex items-center justify-between py-2.5 px-1 text-sm">
          <div className="flex items-center gap-2">
            <CalendarCheck size={14} className="text-muted-foreground shrink-0" />
            <span>{new Date(att.attended_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
            })}</span>
            {att.memo && (
              <span className="text-xs text-muted-foreground">— {att.memo}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {att.subscription?.type === 'count' ? '횟수제' : '기간제'}
          </span>
        </div>
      ))}
    </div>
  )
}
