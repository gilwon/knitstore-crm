'use client'

import { useState, useMemo } from 'react'
import { Plus, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { OnlineSalesSubNav } from '@/features/online-sales/components/OnlineSalesSubNav'
import { OnlineSaleTable } from '@/features/online-sales/components/OnlineSaleTable'
import { OnlineSaleForm } from '@/features/online-sales/components/OnlineSaleForm'
import { ExcelImportDialog } from '@/features/online-sales/components/ExcelImportDialog'
import { useOnlineSales } from '@/features/online-sales/hooks/useOnlineSales'
import { useAllTemplates } from '@/features/online-sales/hooks/usePackagingTemplates'
import { useShop } from '@/features/inventory/hooks/useShop'
import { exportOnlineSales } from '@/features/online-sales/utils/exportExcel'
import type { OnlineSale } from '@/features/online-sales/types'

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom'

function getPresetRange(preset: DateRange): { from?: string; to?: string; label: string } {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { from: todayStr, to: todayStr, label: '오늘' }
    case 'week': {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { from: weekAgo.toISOString().split('T')[0], to: todayStr, label: '이번주' }
    }
    case 'month': {
      const monthStart = `${todayStr.substring(0, 7)}-01`
      return { from: monthStart, to: todayStr, label: '이번달' }
    }
    case 'all':
      return { from: undefined, to: undefined, label: '전체' }
    default:
      return { from: undefined, to: undefined, label: '' }
  }
}

export default function OnlineSalesPage() {
  const { data: shop } = useShop()
  const shopId = shop?.id || ''

  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editSale, setEditSale] = useState<OnlineSale | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const { from, to, label: dateLabel } = useMemo(() => {
    if (dateRange === 'custom') return { from: customFrom || undefined, to: customTo || undefined, label: '사용자지정' }
    return getPresetRange(dateRange)
  }, [dateRange, customFrom, customTo])

  const { data: sales = [], isLoading } = useOnlineSales(shopId, from, to)
  const { data: templates = [] } = useAllTemplates(shopId)

  const handleEdit = (sale: OnlineSale) => {
    setEditSale(sale)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditSale(null)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="온라인 판매" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <OnlineSalesSubNav />

        {/* 액션 바 */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={14} className="mr-1" /> 판매 등록
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload size={14} className="mr-1" /> 엑셀 업로드
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportOnlineSales(sales, dateLabel)}
            disabled={sales.length === 0}
          >
            <Download size={14} className="mr-1" /> 엑셀 다운로드
          </Button>

          <div className="ml-auto flex gap-1">
            {(['today', 'week', 'month', 'all', 'custom'] as DateRange[]).map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant={dateRange === preset ? 'default' : 'ghost'}
                onClick={() => setDateRange(preset)}
              >
                {{ today: '오늘', week: '이번주', month: '이번달', all: '전체', custom: '직접' }[preset]}
              </Button>
            ))}
          </div>
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

        {/* 목록 */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>
        ) : (
          <OnlineSaleTable sales={sales} onEdit={handleEdit} />
        )}
      </div>

      {/* 폼 */}
      {shopId && (
        <>
          <OnlineSaleForm
            shopId={shopId}
            open={formOpen}
            onOpenChange={handleFormClose}
            editSale={editSale}
            packagingTemplates={templates}
          />
          <ExcelImportDialog
            shopId={shopId}
            open={importOpen}
            onOpenChange={setImportOpen}
          />
        </>
      )}
    </div>
  )
}
