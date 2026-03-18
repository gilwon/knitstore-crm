'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeeklySalesChart } from '../hooks/useWeeklySalesChart'

export function WeeklySalesChart() {
  const { data: weekly, isLoading } = useWeeklySalesChart()

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">주간 매출 추이</CardTitle></CardHeader>
        <CardContent><div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">로딩 중...</div></CardContent>
      </Card>
    )
  }

  const hasData = weekly && weekly.some((d) => d.amount > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">주간 매출 추이 (최근 7일)</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
            판매 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-xs" />
              <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => [`${Number(value).toLocaleString()}원`, '매출']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
