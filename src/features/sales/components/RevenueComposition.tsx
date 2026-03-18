'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  productRevenue: number
  classRevenue: number
}

const COLORS = ['#6366f1', '#a78bfa']

export function RevenueComposition({ productRevenue, classRevenue }: Props) {
  const total = productRevenue + classRevenue
  if (total === 0) return null

  const data = [
    { name: '상품 매출', value: productRevenue },
    { name: '수강권 매출', value: classRevenue },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">매출 구성비</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()}원`]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
              <span className="text-muted-foreground">상품</span>
              <span className="font-medium ml-auto">{Math.round((productRevenue / total) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
              <span className="text-muted-foreground">수강권</span>
              <span className="font-medium ml-auto">{Math.round((classRevenue / total) * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
