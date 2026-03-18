'use client'

import { CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTodayAttendance } from '../hooks/useWeeklyAttendance'

export function RecentAttendance() {
  const { data: attendances, isLoading } = useTodayAttendance()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <CalendarCheck size={13} /> 오늘 출석 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">로딩 중...</div>
        ) : !attendances || attendances.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">오늘 출석 기록이 없습니다</div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{attendances.length}명 출석</p>
            {attendances.map((a, i) => {
              const time = new Date(a.attendedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{time}</span>
                    <span>{a.studentName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {a.subscriptionType === 'count' ? '횟수제' : '기간제'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
