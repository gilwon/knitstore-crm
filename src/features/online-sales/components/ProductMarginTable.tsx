'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { calcOnlineSale } from '../utils/calc'
import type { ProductProfitStat, OnlineSale } from '../types'

interface Props {
  items: ProductProfitStat[]
  sales?: OnlineSale[]
}

export function ProductMarginTable({ items, sales = [] }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  const productSales = useMemo(() => {
    if (!selectedProduct) return []
    return sales
      .filter((s) => s.product_name === selectedProduct)
      .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
  }, [sales, selectedProduct])

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
    <>
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
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        className="font-medium text-left text-primary underline-offset-2 hover:underline cursor-pointer"
                        onClick={() => setSelectedProduct(item.product_name)}
                      >
                        {item.product_name}
                      </button>
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

      {/* 상품별 판매 상세 팝업 */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedProduct} 판매 내역</DialogTitle>
          </DialogHeader>
          {productSales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">판매 데이터가 없습니다</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left py-2 pr-3 font-medium">판매일</th>
                    <th className="text-left py-2 pr-3 font-medium">주문번호</th>
                    <th className="text-right py-2 pr-3 font-medium">판매금액</th>
                    <th className="text-right py-2 pr-3 font-medium">수수료</th>
                    <th className="text-right py-2 pr-3 font-medium">원가</th>
                    <th className="text-right py-2 pr-3 font-medium">이익</th>
                    <th className="text-right py-2 font-medium">마진율</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.map((sale) => {
                    const c = calcOnlineSale(sale)
                    return (
                      <tr key={sale.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap">{sale.sale_date}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{sale.order_number || '-'}</td>
                        <td className="py-2 pr-3 text-right">{sale.sale_amount.toLocaleString()}원</td>
                        <td className="py-2 pr-3 text-right text-muted-foreground">{c.totalFee.toLocaleString()}원</td>
                        <td className="py-2 pr-3 text-right text-muted-foreground">{c.totalCost.toLocaleString()}원</td>
                        <td className="py-2 pr-3 text-right font-medium">
                          <span className={c.profit < 0 ? 'text-destructive' : ''}>
                            {c.profit.toLocaleString()}원
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <Badge
                            variant={c.marginRate >= 30 ? 'default' : c.marginRate < 0 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {c.marginRate.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-medium">
                    <td colSpan={2} className="py-2 pr-3 text-right text-muted-foreground">합계 ({productSales.length}건)</td>
                    <td className="py-2 pr-3 text-right">
                      {productSales.reduce((s, v) => s + v.sale_amount, 0).toLocaleString()}원
                    </td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">
                      {productSales.reduce((s, v) => s + calcOnlineSale(v).totalFee, 0).toLocaleString()}원
                    </td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">
                      {productSales.reduce((s, v) => s + calcOnlineSale(v).totalCost, 0).toLocaleString()}원
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {productSales.reduce((s, v) => s + calcOnlineSale(v).profit, 0).toLocaleString()}원
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
