'use client'

import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DiscountType, OrderDiscount } from '../types'

interface Props {
  subtotal: number
  orderDiscount: OrderDiscount | null
  onApply: (discount: OrderDiscount | null) => void
}

export function OrderDiscountBar({ subtotal, orderDiscount, onApply }: Props) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState<DiscountType>(orderDiscount?.type ?? 'fixed')
  const [value, setValue] = useState(String(orderDiscount?.value ?? ''))

  if (!editing && !orderDiscount) {
    return (
      <button
        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 py-1"
        onClick={() => setEditing(true)}
      >
        <Tag size={11} /> 전체 할인 추가
      </button>
    )
  }

  if (!editing && orderDiscount) {
    const amount = orderDiscount.type === 'fixed'
      ? Math.min(orderDiscount.value, subtotal)
      : Math.round(subtotal * (orderDiscount.value / 100))
    return (
      <div className="flex items-center justify-between text-xs py-1">
        <span className="text-muted-foreground flex items-center gap-1">
          <Tag size={11} />
          전체 할인 ({orderDiscount.type === 'fixed' ? `${orderDiscount.value.toLocaleString()}원` : `${orderDiscount.value}%`})
        </span>
        <div className="flex items-center gap-1">
          <span className="text-destructive font-medium">-{amount.toLocaleString()}원</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onApply(null)}>
            <X size={10} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 py-1 border-t">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant={type === 'fixed' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setType('fixed')}
          >
            정액
          </Button>
          <Button
            type="button"
            variant={type === 'rate' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setType('rate')}
          >
            정률
          </Button>
        </div>
        <Input
          type="number"
          min={0}
          className="h-7 text-xs flex-1"
          placeholder={type === 'fixed' ? '원' : '%'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            const num = Number(value)
            if (num > 0) onApply({ type, value: num })
            setEditing(false)
          }}
        >
          적용
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setEditing(false)}
        >
          취소
        </Button>
      </div>
    </div>
  )
}
