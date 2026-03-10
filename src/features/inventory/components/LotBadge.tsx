import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lot, Product } from '@/types/database'

interface LotBadgeProps {
  lot: Lot
  unit: Product['unit']
  alertThreshold: number
  className?: string
}

export function LotBadge({ lot, unit, alertThreshold, className }: LotBadgeProps) {
  const isEmpty = lot.stock_quantity === 0
  const isLow = alertThreshold > 0 && lot.stock_quantity > 0 && lot.stock_quantity <= alertThreshold

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        isEmpty && 'bg-muted text-muted-foreground',
        isLow && 'bg-amber-100 text-amber-800',
        !isEmpty && !isLow && 'bg-emerald-100 text-emerald-800',
        className
      )}
    >
      {isLow && <AlertTriangle size={11} />}
      {lot.stock_quantity} {unit === 'ball' ? '볼' : 'g'}
    </span>
  )
}
