'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { OnlineSalesSubNav } from '@/features/online-sales/components/OnlineSalesSubNav'
import { ProfitSummaryCards } from '@/features/online-sales/components/ProfitSummaryCards'
import { MonthlyProfitChart } from '@/features/online-sales/components/MonthlyProfitChart'
import { ProductMarginTable } from '@/features/online-sales/components/ProductMarginTable'
import { useOnlineSales } from '@/features/online-sales/hooks/useOnlineSales'
import { useShop } from '@/features/inventory/hooks/useShop'
import { calcSalesStats } from '@/features/online-sales/utils/calc'

type DateRange = 'month' | 'lastMonth' | '3months' | 'all' | 'custom'

function getPresetRange(preset: DateRange): { from?: string; to?: string } {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  switch (preset) {
    case 'month':
      return { from: `${todayStr.substring(0, 7)}-01`, to: todayStr }
    case 'lastMonth': {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        from: last.toISOString().split('T')[0],
        to: lastEnd.toISOString().split('T')[0],
      }
    }
    case '3months': {
      const three = new Date(now)
      three.setMonth(three.getMonth() - 3)
      return { from: three.toISOString().split('T')[0], to: todayStr }
    }
    case 'all':
      return { from: undefined, to: undefined }
    default:
      return { from: undefined, to: undefined }
  }
}

export default function OnlineSalesDashboardPage() {
  const { data: shop } = useShop()
  const shopId = shop?.id || ''

  const [dateRange, setDateRange] = useState<DateRange>('3months')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const { from, to } = useMemo(() => {
    if (dateRange === 'custom') return { from: customFrom || undefined, to: customTo || undefined }
    return getPresetRange(dateRange)
  }, [dateRange, customFrom, customTo])

  const { data: sales = [], isLoading } = useOnlineSales(shopId, from, to)

  const stats = useMemo(() => calcSalesStats(sales), [sales])

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="온라인 판매" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <OnlineSalesSubNav />

        {/* 기간 필터 */}
        <div className="flex flex-wrap items-center gap-1">
          {(['month', 'lastMonth', '3months', 'all', 'custom'] as DateRange[]).map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={dateRange === preset ? 'default' : 'ghost'}
              onClick={() => setDateRange(preset)}
            >
              {{ month: '이번달', lastMonth: '지난달', '3months': '3개월', all: '전체', custom: '직접' }[preset]}
            </Button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
            <span className="text-sm text-muted-foreground">~</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">통계 불러오는 중...</p>
        ) : (
          <div className="space-y-4">
            <ProfitSummaryCards
              totalRevenue={stats.totalRevenue}
              totalProfit={stats.totalProfit}
              avgMarginRate={stats.avgMarginRate}
              saleCount={stats.saleCount}
            />
            <MonthlyProfitChart data={stats.monthlyData} />
            <ProductMarginTable items={stats.productStats} />
          </div>
        )}
      </div>
    </div>
  )
}
