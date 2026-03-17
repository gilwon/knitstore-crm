'use client'

import { useMemo, useState } from 'react'
import { Pencil, Trash2, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { calcOnlineSale } from '../utils/calc'
import { useDeleteOnlineSale, useDeleteOnlineSales } from '../hooks/useOnlineSales'
import type { OnlineSale } from '../types'

type SortKey = 'sale_date' | 'order_number' | 'product_name' | 'sale_amount' | 'profit' | 'marginRate'
type SortDir = 'asc' | 'desc'

interface Props {
  sales: OnlineSale[]
  onEdit: (sale: OnlineSale) => void
}

export function OnlineSaleTable({ sales, onEdit }: Props) {
  const deleteMutation = useDeleteOnlineSale()
  const bulkDeleteMutation = useDeleteOnlineSales()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('sale_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'sale_date' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return sales
    const q = search.trim().toLowerCase()
    return sales.filter(
      (s) =>
        s.order_number.toLowerCase().includes(q) ||
        s.product_name.toLowerCase().includes(q),
    )
  }, [sales, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'profit' || sortKey === 'marginRate') {
        const ca = calcOnlineSale(a)
        const cb = calcOnlineSale(b)
        cmp = sortKey === 'profit' ? ca.profit - cb.profit : ca.marginRate - cb.marginRate
      } else if (sortKey === 'sale_amount') {
        cmp = a.sale_amount - b.sale_amount
      } else {
        cmp = (a[sortKey] || '').localeCompare(b[sortKey] || '')
      }
      // 같으면 판매일 → 주문번호 순 2차 정렬
      if (cmp === 0 && sortKey !== 'sale_date') cmp = a.sale_date.localeCompare(b.sale_date)
      if (cmp === 0 && sortKey !== 'order_number') cmp = (a.order_number || '').localeCompare(b.order_number || '')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const allChecked = sorted.length > 0 && selected.size === sorted.length
  const someChecked = selected.size > 0 && selected.size < sorted.length

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map((s) => s.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    if (selected.size === 0) return
    bulkDeleteMutation.mutate(Array.from(selected), {
      onSuccess: () => setSelected(new Set()),
    })
  }

  const totals = useMemo(() => {
    let totalIncome = 0
    let totalProfit = 0
    for (const sale of sorted) {
      const c = calcOnlineSale(sale)
      totalIncome += c.totalIncome
      totalProfit += c.profit
    }
    const avgMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
    return { totalIncome, totalProfit, avgMargin }
  }, [sorted])

  const thClass = 'py-2 pr-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors'

  return (
    <div className="space-y-2">
      {/* 검색 + 선택 삭제 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="주문번호, 상품명 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">{filtered.length}건</span>
        )}
        {selected.size > 0 && (
          <>
            <Badge variant="secondary">{selected.size}건 선택</Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 size={14} className="mr-1" />
              {bulkDeleteMutation.isPending ? '삭제 중...' : '선택 삭제'}
            </Button>
          </>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? '검색 결과가 없습니다' : '등록된 판매 데이터가 없습니다'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="py-2 pr-2 w-8">
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className={`text-left ${thClass}`} onClick={() => handleSort('sale_date')}>
                  <span className="inline-flex items-center gap-1">판매일 <SortIcon col="sale_date" /></span>
                </th>
                <th className={`text-left ${thClass}`} onClick={() => handleSort('order_number')}>
                  <span className="inline-flex items-center gap-1">주문번호 <SortIcon col="order_number" /></span>
                </th>
                <th className={`text-left ${thClass}`} onClick={() => handleSort('product_name')}>
                  <span className="inline-flex items-center gap-1">상품명 <SortIcon col="product_name" /></span>
                </th>
                <th className={`text-right ${thClass}`} onClick={() => handleSort('sale_amount')}>
                  <span className="inline-flex items-center gap-1 justify-end">판매금액 <SortIcon col="sale_amount" /></span>
                </th>
                <th className="text-right py-2 pr-3 font-medium">합계</th>
                <th className="text-right py-2 pr-3 font-medium">수수료</th>
                <th className="text-right py-2 pr-3 font-medium">원가</th>
                <th className={`text-right ${thClass}`} onClick={() => handleSort('profit')}>
                  <span className="inline-flex items-center gap-1 justify-end">이익 <SortIcon col="profit" /></span>
                </th>
                <th className={`text-right ${thClass}`} onClick={() => handleSort('marginRate')}>
                  <span className="inline-flex items-center gap-1 justify-end">마진율 <SortIcon col="marginRate" /></span>
                </th>
                <th className="text-right py-2 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((sale) => {
                const c = calcOnlineSale(sale)
                return (
                  <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-2">
                      <Checkbox
                        checked={selected.has(sale.id)}
                        onCheckedChange={() => toggleOne(sale.id)}
                      />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {sale.sale_date.substring(5).replace('-', '.')}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {sale.order_number || '-'}
                    </td>
                    <td className="py-2 pr-3 font-medium">{sale.product_name}</td>
                    <td className="py-2 pr-3 text-right">{sale.sale_amount.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right font-bold">{c.totalIncome.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">{c.totalFee.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">{c.totalCost.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right font-bold text-destructive">
                      {c.profit.toLocaleString()}
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
              <tr className="border-t-2 text-base font-bold">
                <td></td>
                <td colSpan={4} className="py-3 pr-3 text-right text-muted-foreground">합계</td>
                <td className="py-3 pr-3 text-right">{totals.totalIncome.toLocaleString()}</td>
                <td colSpan={2}></td>
                <td className="py-3 pr-3 text-right text-lg text-destructive">
                  {totals.totalProfit.toLocaleString()}
                </td>
                <td className="py-3 pr-3 text-right">
                  <Badge
                    variant={totals.avgMargin >= 30 ? 'default' : totals.avgMargin < 0 ? 'destructive' : 'secondary'}
                  >
                    {totals.avgMargin.toFixed(1)}%
                  </Badge>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
