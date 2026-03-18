'use client'

import { Filter, ArrowUpDown, AlertTriangle } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { InventoryFilterState, StockStatus, UnitFilter, ProductSortBy } from '../types'

interface InventoryFiltersProps {
  filters: InventoryFilterState
  onFiltersChange: (filters: InventoryFilterState) => void
  brands: string[]
  lowStockCount: number
  totalCount: number
  filteredCount: number
}

const statusLabels: Record<StockStatus, string> = {
  all: '전체',
  normal: '정상',
  low: '부족',
  out: '품절',
}

const unitLabels: Record<UnitFilter, string> = {
  all: '전체',
  ball: 'ball',
  g: 'g',
}

const sortLabels: Record<ProductSortBy, string> = {
  name: '이름순',
  stock: '재고순',
  price: '가격순',
  created_at: '등록순',
}

export function InventoryFilters({
  filters,
  onFiltersChange,
  brands,
  lowStockCount,
  totalCount,
  filteredCount,
}: InventoryFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 브랜드 필터 */}
      <Select
        value={filters.brand}
        onValueChange={(v) => onFiltersChange({ ...filters, brand: v ?? 'all' })}
      >
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue>{filters.brand === 'all' ? '브랜드' : filters.brand}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">전체 브랜드</SelectItem>
          {brands.map((b) => (
            <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 재고 상태 필터 */}
      <div className="flex items-center gap-1.5">
        <Filter size={13} className="text-muted-foreground" />
        <Select
          value={filters.stockStatus}
          onValueChange={(v) => onFiltersChange({ ...filters, stockStatus: v as StockStatus })}
        >
          <SelectTrigger className="h-8 w-[90px] text-xs">
            <SelectValue>{statusLabels[filters.stockStatus]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 단위 필터 */}
      <Select
        value={filters.unit}
        onValueChange={(v) => onFiltersChange({ ...filters, unit: v as UnitFilter })}
      >
        <SelectTrigger className="h-8 w-[80px] text-xs">
          <SelectValue>{filters.unit === 'all' ? '단위' : filters.unit}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(unitLabels).map(([value, label]) => (
            <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 정렬 */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown size={13} className="text-muted-foreground" />
        <Select
          value={filters.sortBy}
          onValueChange={(v) => onFiltersChange({ ...filters, sortBy: v as ProductSortBy })}
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue>{sortLabels[filters.sortBy]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 부족 알림 배지 */}
      {lowStockCount > 0 && (
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors"
          onClick={() => onFiltersChange({ ...filters, stockStatus: filters.stockStatus === 'low' ? 'all' : 'low' })}
          title="부족 상품 필터 토글"
        >
          <AlertTriangle size={13} className="text-destructive" />
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            {lowStockCount}
          </Badge>
        </button>
      )}

      {(filters.brand !== 'all' || filters.stockStatus !== 'all' || filters.unit !== 'all' || totalCount !== filteredCount) && (
        <span className="text-xs text-muted-foreground ml-1">
          {totalCount}개 중 {filteredCount}개
        </span>
      )}
    </div>
  )
}
