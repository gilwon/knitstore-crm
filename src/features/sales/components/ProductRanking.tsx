'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductRankItem } from '../types'

interface Props {
  items: ProductRankItem[]
}

export function ProductRanking({ items }: Props) {
  const top8 = items.slice(0, 8)

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">상품별 판매 랭킹</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          판매 데이터가 없습니다
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">상품별 판매 랭킹</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 가로 막대 차트 */}
        <ResponsiveContainer width="100%" height={top8.length * 36 + 20}>
          <BarChart
            data={top8}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v: number) =>
                v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${v.toLocaleString()}`
              }
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="product_name"
              width={80}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']}
            />
            <Bar dataKey="total_revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* 랭킹 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-2 pr-3 font-medium w-8">#</th>
                <th className="text-left py-2 pr-3 font-medium">상품명</th>
                <th className="text-right py-2 pr-3 font-medium">수량</th>
                <th className="text-right py-2 pr-3 font-medium">매출</th>
                <th className="text-right py-2 font-medium">마진율</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const marginRateColor =
                  item.total_cost === 0
                    ? 'secondary'
                    : item.margin_rate >= 30
                      ? 'default'
                      : item.margin_rate < 0
                        ? 'destructive'
                        : 'secondary'
                return (
                  <tr key={item.product_id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <p className="font-medium truncate max-w-[120px]">{item.product_name}</p>
                      {item.brand && (
                        <p className="text-xs text-muted-foreground">{item.brand}</p>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">
                      {item.total_quantity}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {item.total_revenue.toLocaleString()}원
                    </td>
                    <td className="py-2 text-right">
                      {item.total_cost === 0 ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : (
                        <Badge variant={marginRateColor} className="text-xs">
                          {item.margin_rate.toFixed(1)}%
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
