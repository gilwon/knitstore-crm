'use client'

import { useState } from 'react'
import { Receipt, ShoppingBag, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalesWithSubs } from '../hooks/useSalesWithSubs'
import { SaleRow } from './SaleRow'
import type { SaleTypeFilter } from '../types'

const TYPE_LABELS: Record<SaleTypeFilter, string> = {
  all: '전체',
  product_sale: '상품',
  class_fee: '수강권',
}

interface Props {
  shopId: string
  from?: string
  to?: string
  dateRangeLabel: string
}

export function SalesHistoryTab({ shopId, from, to, dateRangeLabel }: Props) {
  const [typeFilter, setTypeFilter] = useState<SaleTypeFilter>('all')
  const { data: sales = [], isLoading } = useSalesWithSubs(shopId, from, to, typeFilter)

  const totalAmount = sales.reduce((s, sale) => s + sale.total_amount, 0)

  return (
    <div className="space-y-4">
      {/* 유형 필터 */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 self-start">
        {(Object.keys(TYPE_LABELS) as SaleTypeFilter[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              typeFilter === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag size={12} /> 판매 건수
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {sales.length}
              <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={12} /> 총 매출
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {totalAmount.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 판매 목록 */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>
      ) : sales.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <Receipt size={32} className="opacity-30" />
            <p className="text-sm">{dateRangeLabel} 판매 내역이 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  )
}
