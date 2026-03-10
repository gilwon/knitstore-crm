'use client'

import { useState } from 'react'
import { Receipt, ChevronDown, ChevronUp, ShoppingBag, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useShop } from '@/features/inventory/hooks/useShop'
import { useSales } from '@/features/pos/hooks/useSales'
import type { SaleWithItems } from '@/features/pos/hooks/useSales'

type DateRange = 'today' | 'week' | 'month' | 'all'

function getDateRange(range: DateRange): { from?: string; to?: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  if (range === 'today') {
    return {
      from: new Date(y, m, d, 0, 0, 0, 0).toISOString(),
      to: new Date(y, m, d, 23, 59, 59, 999).toISOString(),
    }
  }
  if (range === 'week') {
    const day = now.getDay()
    const monOffset = (day + 6) % 7
    return { from: new Date(y, m, d - monOffset, 0, 0, 0, 0).toISOString() }
  }
  if (range === 'month') {
    return { from: new Date(y, m, 1, 0, 0, 0, 0).toISOString() }
  }
  return {}
}

const RANGE_LABELS: Record<DateRange, string> = {
  today: '오늘',
  week: '이번 주',
  month: '이번 달',
  all: '전체',
}

function SaleRow({ sale }: { sale: SaleWithItems }) {
  const [open, setOpen] = useState(false)

  const date = new Date(sale.created_at)
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const summary = sale.items.map((i) => i.product_name).filter(Boolean).join(', ') || '판매'

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{dateStr} {timeStr}</p>
          <p className="text-sm font-medium mt-0.5 truncate">{summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-sm font-semibold">{sale.total_amount.toLocaleString()}원</span>
          <Badge variant="secondary" className="text-xs">{sale.items.length}종</Badge>
          {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
          {sale.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                {item.brand && <span className="text-xs text-muted-foreground">{item.brand} </span>}
                <span className="font-medium">{item.product_name}</span>
                {item.color_name && (
                  <span className="text-xs text-muted-foreground ml-1">{item.color_name}</span>
                )}
                <span className="text-xs text-muted-foreground font-mono ml-1.5">{item.lot_number}</span>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className="text-xs text-muted-foreground">
                  {item.quantity}{item.unit === 'ball' ? '볼' : 'g'} × {item.unit_price.toLocaleString()}원
                </span>
                <span className="font-semibold text-sm ml-2">{item.subtotal.toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function SalesPage() {
  const { data: shop } = useShop()
  const [range, setRange] = useState<DateRange>('today')
  const { from, to } = getDateRange(range)
  const { data: sales = [], isLoading } = useSales(shop?.id, from, to)

  const totalAmount = sales.reduce((s, sale) => s + sale.total_amount, 0)

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h1 className="text-xl font-semibold">판매 내역</h1>
          <p className="text-sm text-muted-foreground mt-0.5">실 판매 기록을 조회합니다</p>
        </div>
        {/* 날짜 필터 */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">

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
                <p className="text-sm">{RANGE_LABELS[range]} 판매 내역이 없습니다</p>
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
      </div>
    </div>
  )
}
