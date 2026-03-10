'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductRankItem } from '../types'

interface Props {
  items: ProductRankItem[]
  totalMargin: number
  totalMarginRate: number
}

export function MarginTable({ items, totalMargin, totalMarginRate }: Props) {
  const itemsWithCost = items.filter((i) => i.total_cost > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">마진 분석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">전체 마진액</p>
            <p
              className={`text-xl font-bold ${totalMargin >= 0 ? 'text-foreground' : 'text-destructive'}`}
            >
              {totalMargin.toLocaleString()}원
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">전체 마진율</p>
            <p
              className={`text-xl font-bold ${totalMarginRate >= 0 ? 'text-foreground' : 'text-destructive'}`}
            >
              {totalMarginRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 상품별 마진 테이블 */}
        {itemsWithCost.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            원가(매입가)가 입력된 상품이 없습니다
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 pr-3 font-medium">상품명</th>
                  <th className="text-right py-2 pr-3 font-medium">매출</th>
                  <th className="text-right py-2 pr-3 font-medium">원가</th>
                  <th className="text-right py-2 pr-3 font-medium">마진</th>
                  <th className="text-right py-2 font-medium">마진율</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithCost.map((item) => (
                  <tr key={item.product_id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <p className="font-medium truncate max-w-[120px]">{item.product_name}</p>
                      {item.brand && (
                        <p className="text-xs text-muted-foreground">{item.brand}</p>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right">{item.total_revenue.toLocaleString()}원</td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">
                      {item.total_cost.toLocaleString()}원
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {item.margin.toLocaleString()}원
                    </td>
                    <td className="py-2 text-right">
                      <Badge
                        variant={
                          item.margin_rate >= 30
                            ? 'default'
                            : item.margin_rate < 0
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {item.margin_rate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
