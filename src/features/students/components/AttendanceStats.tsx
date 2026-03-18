'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAttendanceStats } from '../hooks/useAttendanceStats'

export function AttendanceStats() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { data: stats, isLoading } = useAttendanceStats(year, month)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">통계 불러오는 중...</div>
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      {/* 월 선택 */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-semibold w-24 text-center">{year}년 {month}월</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarCheck size={12} /> 이번 달 출석
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {stats.summary.totalThisMonth}
              <span className="text-sm font-normal text-muted-foreground ml-1">회</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users size={12} /> 출석 수강생
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {stats.summary.activeStudents}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {stats.summary.totalStudents}명
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={12} /> 인당 평균
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {stats.summary.activeStudents > 0
                ? (stats.summary.totalThisMonth / stats.summary.activeStudents).toFixed(1)
                : '0'}
              <span className="text-sm font-normal text-muted-foreground ml-1">회</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 월별 추이 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">월별 출석 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.monthly.every((m) => m.count === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">출석 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value) => [`${value}회`, '출석']}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 수강생별 출석 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">수강생별 출석 ({month}월)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.byStudent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">이번 달 출석 기록이 없습니다</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">이름</TableHead>
                  <TableHead className="px-4 text-right">출석 횟수</TableHead>
                  <TableHead className="px-4 text-right">출석률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byStudent.map((s) => {
                  // 해당 월 영업일 기준 출석률 (주 5일 x 4주 = 20일 기준)
                  const workingDays = 20
                  const rate = Math.min(100, Math.round((s.thisMonth / workingDays) * 100))
                  return (
                    <TableRow key={s.studentName}>
                      <TableCell className="px-4 text-sm">{s.studentName}</TableCell>
                      <TableCell className="px-4 text-sm text-right font-medium">{s.thisMonth}회</TableCell>
                      <TableCell className="px-4 text-sm text-right text-muted-foreground">{rate}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
