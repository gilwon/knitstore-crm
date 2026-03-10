'use client'

import { useState } from 'react'
import { Download, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShop } from '@/features/inventory/hooks/useShop'
import { SalesHistoryTab } from '@/features/sales/components/SalesHistoryTab'
import { SalesStatsTab } from '@/features/sales/components/SalesStatsTab'
import { useSalesWithSubs } from '@/features/sales/hooks/useSalesWithSubs'
import { useSalesStats } from '@/features/sales/hooks/useSalesStats'
import { exportSalesHistory, exportSalesStats } from '@/features/sales/utils/exportExcel'

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom'
type ActiveTab = 'history' | 'stats'

function toISOStart(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toISOString()
}
function toISOEnd(dateStr: string) {
  return new Date(dateStr + 'T23:59:59.999').toISOString()
}
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getPresetRange(range: DateRange): { from?: string; to?: string } {
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

const PRESET_LABELS: Record<Exclude<DateRange, 'custom'>, string> = {
  today: '오늘',
  week: '이번 주',
  month: '이번 달',
  all: '전체',
}

function ExcelExportButton({
  activeTab,
  shopId,
  from,
  to,
  dateRangeLabel,
}: {
  activeTab: ActiveTab
  shopId: string | undefined
  from?: string
  to?: string
  dateRangeLabel: string
}) {
  const { data: sales = [] } = useSalesWithSubs(
    activeTab === 'history' ? shopId : undefined,
    from,
    to
  )
  const { data: stats } = useSalesStats(
    activeTab === 'stats' ? shopId : undefined,
    from,
    to
  )

  const handleExport = () => {
    if (activeTab === 'history') {
      exportSalesHistory(sales, dateRangeLabel)
    } else if (stats) {
      exportSalesStats(stats, dateRangeLabel)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download size={14} />
      엑셀 내보내기
    </Button>
  )
}

export default function SalesPage() {
  const { data: shop } = useShop()
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [activeTab, setActiveTab] = useState<ActiveTab>('history')
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())

  const isCustom = dateRange === 'custom'
  const { from, to } = isCustom
    ? { from: toISOStart(customFrom), to: toISOEnd(customTo) }
    : getPresetRange(dateRange)

  const dateRangeLabel = isCustom
    ? `${customFrom}~${customTo}`
    : PRESET_LABELS[dateRange as Exclude<DateRange, 'custom'>]

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between px-6 min-h-[68px] border-b shrink-0 gap-3 flex-wrap py-3">
        <div>
          <h1 className="text-xl font-semibold">판매 내역</h1>
          <p className="text-sm text-muted-foreground mt-0.5">판매 기록 및 통계를 조회합니다</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {shop?.id && (
            <ExcelExportButton
              activeTab={activeTab}
              shopId={shop.id}
              from={from}
              to={to}
              dateRangeLabel={dateRangeLabel}
            />
          )}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              내역
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              통계
            </button>
          </div>
        </div>
      </div>

      {/* 기간 필터 */}
      <div className="px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 프리셋 탭 */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(Object.keys(PRESET_LABELS) as Exclude<DateRange, 'custom'>[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  dateRange === r
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {PRESET_LABELS[r]}
              </button>
            ))}
            {/* 기간 선택 버튼 */}
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isCustom
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarRange size={13} />
              기간 선택
            </button>
          </div>

          {/* 커스텀 날짜 입력 (기간 선택 시만 표시) */}
          {isCustom && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 w-36 text-sm"
              />
              <span className="text-sm text-muted-foreground">~</span>
              <Input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayStr()}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full">
          {shop?.id && activeTab === 'history' && (
            <SalesHistoryTab
              shopId={shop.id}
              from={from}
              to={to}
              dateRangeLabel={dateRangeLabel}
            />
          )}
          {shop?.id && activeTab === 'stats' && (
            <SalesStatsTab
              shopId={shop.id}
              from={from}
              to={to}
              dateRange={dateRange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
