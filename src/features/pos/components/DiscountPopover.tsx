'use client'

import { useState } from 'react'
import { Percent, Tag } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DiscountType, ItemDiscount } from '../types'

interface Props {
  lotId: string
  lineTotal: number
  currentDiscount?: ItemDiscount
  onApply: (discount: ItemDiscount) => void
  onRemove: () => void
}

export function DiscountPopover({ lotId, lineTotal, currentDiscount, onApply, onRemove }: Props) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<DiscountType>(currentDiscount?.type ?? 'fixed')
  const [value, setValue] = useState(String(currentDiscount?.value ?? ''))

  function handleApply() {
    const numValue = Number(value)
    if (!numValue || numValue <= 0) return
    onApply({ lotId, type, value: numValue })
    setOpen(false)
  }

  const discountAmount = currentDiscount
    ? currentDiscount.type === 'fixed'
      ? Math.min(currentDiscount.value, lineTotal)
      : Math.round(lineTotal * (currentDiscount.value / 100))
    : 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors ${discountAmount > 0 ? 'text-primary' : 'text-muted-foreground'}`}
        title="할인"
      >
        <Tag size={12} />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-2">
        <p className="text-xs font-medium">품목 할인</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={type === 'fixed' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => setType('fixed')}
          >
            정액 (원)
          </Button>
          <Button
            type="button"
            variant={type === 'rate' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => setType('rate')}
          >
            정률 (%)
          </Button>
        </div>
        <Input
          type="number"
          min={0}
          max={type === 'rate' ? 100 : lineTotal}
          placeholder={type === 'fixed' ? '할인 금액' : '할인율'}
          className="h-8 text-xs"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex gap-1">
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleApply}>적용</Button>
          {currentDiscount && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { onRemove(); setOpen(false) }}>
              해제
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
