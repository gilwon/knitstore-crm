'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SubscriptionBreakdownData } from '../types'

const COLORS = ['#6366f1', '#a78bfa']

interface Props {
  data: SubscriptionBreakdownData
}

export function SubscriptionBreakdown({ data }: Props) {
  const pieData = [
    { name: '횟수권', value: data.count_type_revenue },
    { name: '기간권', value: data.period_type_revenue },
  ].filter((d) => d.value > 0)

  const isEmpty = data.total_count === 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">수강권 유형별 배분율</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="py-8 text-center text-sm text-muted-foreground">수강권 판매 데이터가 없습니다</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* 파이 차트 */}
            <div className="w-full sm:w-48 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${Number(v).toLocaleString()}원`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 통계 카드 */}
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-xs text-muted-foreground">횟수권</span>
                </div>
                <p className="text-lg font-bold">{data.count_type_count}건</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.count_type_revenue.toLocaleString()}원
                </p>
                {data.total_revenue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((data.count_type_revenue / data.total_revenue) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                  <span className="text-xs text-muted-foreground">기간권</span>
                </div>
                <p className="text-lg font-bold">{data.period_type_count}건</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.period_type_revenue.toLocaleString()}원
                </p>
                {data.total_revenue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((data.period_type_revenue / data.total_revenue) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
