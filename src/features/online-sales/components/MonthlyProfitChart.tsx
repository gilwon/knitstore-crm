'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MonthlyProfitData } from '../types'

interface Props {
  data: MonthlyProfitData[]
}

const formatY = (v: number) => {
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}천`
  return String(v)
}

const formatMonth = (month: string) => {
  const parts = month.split('-')
  return `${parts[1]}월`
}

export function MonthlyProfitChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">월별 이익 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">데이터가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">월별 이익 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={formatMonth} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatY} />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString()}원`,
                name === 'revenue' ? '매출' : '이익',
              ]}
              labelFormatter={(label) => formatMonth(String(label))}
            />
            <Legend formatter={(value) => (value === 'revenue' ? '매출' : '이익')} />
            <Bar dataKey="revenue" fill="hsl(var(--muted-foreground) / 0.3)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
