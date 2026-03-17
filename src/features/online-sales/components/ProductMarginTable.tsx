'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductProfitStat } from '../types'

interface Props {
  items: ProductProfitStat[]
}

export function ProductMarginTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">상품별 마진 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">데이터가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">상품별 마진 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-2 pr-3 font-medium">상품명</th>
                <th className="text-right py-2 pr-3 font-medium">건수</th>
                <th className="text-right py-2 pr-3 font-medium">매출</th>
                <th className="text-right py-2 pr-3 font-medium">비용합계</th>
                <th className="text-right py-2 pr-3 font-medium">이익</th>
                <th className="text-right py-2 font-medium">마진율</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.product_name} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium truncate max-w-[140px]">
                    {item.product_name}
                  </td>
                  <td className="py-2 pr-3 text-right text-muted-foreground">{item.count}</td>
                  <td className="py-2 pr-3 text-right">{item.totalRevenue.toLocaleString()}원</td>
                  <td className="py-2 pr-3 text-right text-muted-foreground">
                    {item.totalCost.toLocaleString()}원
                  </td>
                  <td className="py-2 pr-3 text-right font-medium">
                    <span className={item.totalProfit < 0 ? 'text-destructive' : ''}>
                      {item.totalProfit.toLocaleString()}원
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <Badge
                      variant={item.marginRate >= 30 ? 'default' : item.marginRate < 0 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.marginRate.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
