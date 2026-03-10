'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SaleWithItemsExtended } from '../types'

interface Props {
  sale: SaleWithItemsExtended
}

export function SaleRow({ sale }: Props) {
  const [open, setOpen] = useState(false)

  const date = new Date(sale.created_at)
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  const summary =
    sale.type === 'product_sale'
      ? sale.items.map((i) => i.product_name).filter(Boolean).join(', ') || '상품 판매'
      : sale.items
          .map((i) =>
            i.subscription_type === 'count'
              ? `횟수권 ${i.subscription_total_count ?? ''}회`
              : '기간권'
          )
          .join(', ') || '수강권 판매'

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {dateStr} {timeStr}
            {sale.student_name && (
              <span className="ml-2 text-primary">{sale.student_name}</span>
            )}
          </p>
          <p className="text-sm font-medium mt-0.5 truncate">{summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-sm font-semibold">{sale.total_amount.toLocaleString()}원</span>
          <Badge
            variant={sale.type === 'class_fee' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {sale.type === 'class_fee' ? '수강권' : '상품'}
          </Badge>
          {open ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
          {sale.items.map((item) => {
            const isProduct = !!item.product_name
            return (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  {isProduct ? (
                    <>
                      {item.brand && (
                        <span className="text-xs text-muted-foreground">{item.brand} </span>
                      )}
                      <span className="font-medium">{item.product_name}</span>
                      {item.color_name && (
                        <span className="text-xs text-muted-foreground ml-1">{item.color_name}</span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono ml-1.5">
                        {item.lot_number}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {item.subscription_type === 'count'
                        ? `횟수권 ${item.subscription_total_count ?? ''}회`
                        : '기간권'}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  {isProduct && (
                    <span className="text-xs text-muted-foreground">
                      {item.quantity}
                      {item.unit === 'ball' ? '볼' : 'g'} × {item.unit_price.toLocaleString()}원
                    </span>
                  )}
                  <span className="font-semibold text-sm ml-2">
                    {item.subtotal.toLocaleString()}원
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
