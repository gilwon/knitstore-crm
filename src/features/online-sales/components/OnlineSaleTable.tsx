'use client'

import { useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calcOnlineSale } from '../utils/calc'
import { useDeleteOnlineSale } from '../hooks/useOnlineSales'
import type { OnlineSale } from '../types'

interface Props {
  sales: OnlineSale[]
  onEdit: (sale: OnlineSale) => void
}

export function OnlineSaleTable({ sales, onEdit }: Props) {
  const deleteMutation = useDeleteOnlineSale()

  const totals = useMemo(() => {
    let totalIncome = 0
    let totalProfit = 0
    for (const sale of sales) {
      const c = calcOnlineSale(sale)
      totalIncome += c.totalIncome
      totalProfit += c.profit
    }
    const avgMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
    return { totalIncome, totalProfit, avgMargin }
  }, [sales])

  if (sales.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        등록된 판매 데이터가 없습니다
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="text-left py-2 pr-3 font-medium">판매일</th>
            <th className="text-left py-2 pr-3 font-medium">상품명</th>
            <th className="text-right py-2 pr-3 font-medium">판매금액</th>
            <th className="text-right py-2 pr-3 font-medium">합계</th>
            <th className="text-right py-2 pr-3 font-medium">수수료</th>
            <th className="text-right py-2 pr-3 font-medium">원가</th>
            <th className="text-right py-2 pr-3 font-medium">이익</th>
            <th className="text-right py-2 pr-3 font-medium">마진율</th>
            <th className="text-right py-2 font-medium w-20"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const c = calcOnlineSale(sale)
            return (
              <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-2 pr-3 whitespace-nowrap">
                  {sale.sale_date.substring(5).replace('-', '.')}
                </td>
                <td className="py-2 pr-3">
                  <p className="font-medium truncate max-w-[140px]">{sale.product_name}</p>
                  {sale.order_number && (
                    <p className="text-xs text-muted-foreground">
                      ...{sale.order_number.slice(-8)}
                    </p>
                  )}
                </td>
                <td className="py-2 pr-3 text-right">{sale.sale_amount.toLocaleString()}</td>
                <td className="py-2 pr-3 text-right">{c.totalIncome.toLocaleString()}</td>
                <td className="py-2 pr-3 text-right text-muted-foreground">{c.totalFee.toLocaleString()}</td>
                <td className="py-2 pr-3 text-right text-muted-foreground">{c.totalCost.toLocaleString()}</td>
                <td className="py-2 pr-3 text-right font-medium">
                  <span className={c.profit < 0 ? 'text-destructive' : ''}>
                    {c.profit.toLocaleString()}
                  </span>
                </td>
                <td className="py-2 pr-3 text-right">
                  <Badge
                    variant={c.marginRate >= 30 ? 'default' : c.marginRate < 0 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {c.marginRate.toFixed(1)}%
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sale)}>
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(sale.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-medium">
            <td colSpan={3} className="py-2 pr-3 text-right text-muted-foreground">합계</td>
            <td className="py-2 pr-3 text-right">{totals.totalIncome.toLocaleString()}</td>
            <td colSpan={2}></td>
            <td className="py-2 pr-3 text-right">
              <span className={totals.totalProfit < 0 ? 'text-destructive' : ''}>
                {totals.totalProfit.toLocaleString()}
              </span>
            </td>
            <td className="py-2 pr-3 text-right">
              <Badge
                variant={totals.avgMargin >= 30 ? 'default' : totals.avgMargin < 0 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {totals.avgMargin.toFixed(1)}%
              </Badge>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
