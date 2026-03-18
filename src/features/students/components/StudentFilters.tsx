'use client'

import { Filter, ArrowUpDown } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { StudentFilterState, SubscriptionFilter, StudentSortBy } from '../types'

interface StudentFiltersProps {
  filters: StudentFilterState
  onFiltersChange: (filters: StudentFilterState) => void
  totalCount: number
  filteredCount: number
}

const statusLabels: Record<SubscriptionFilter, string> = {
  all: '전체',
  active: '활성',
  expired: '만료',
  exhausted: '소진',
  none: '미보유',
}

const sortLabels: Record<StudentSortBy, string> = {
  name: '이름순',
  created_at: '등록순',
  recent_attendance: '최근출석순',
}

export function StudentFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: StudentFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Filter size={13} className="text-muted-foreground" />
        <Select
          value={filters.subscriptionStatus}
          onValueChange={(v) => onFiltersChange({ ...filters, subscriptionStatus: v as SubscriptionFilter })}
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue>
              {statusLabels[filters.subscriptionStatus]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <ArrowUpDown size={13} className="text-muted-foreground" />
        <Select
          value={filters.sortBy}
          onValueChange={(v) => onFiltersChange({ ...filters, sortBy: v as StudentSortBy })}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue>
              {sortLabels[filters.sortBy]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(filters.subscriptionStatus !== 'all' || totalCount !== filteredCount) && (
        <span className="text-xs text-muted-foreground ml-1">
          {totalCount}명 중 {filteredCount}명
        </span>
      )}
    </div>
  )
}
