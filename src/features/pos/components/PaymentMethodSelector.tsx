'use client'

import { Banknote, CreditCard, Building2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaymentMethod } from '../types'

interface Props {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

const methods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: '현금', icon: Banknote },
  { value: 'card', label: '카드', icon: CreditCard },
  { value: 'transfer', label: '이체', icon: Building2 },
  { value: 'other', label: '기타', icon: MoreHorizontal },
]

export function PaymentMethodSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">결제 수단</p>
      <div className="flex gap-1">
        {methods.map(({ value: val, label, icon: Icon }) => (
          <Button
            key={val}
            type="button"
            variant={value === val ? 'default' : 'outline'}
            size="sm"
            className="text-xs gap-1 px-2.5 h-8 flex-1"
            onClick={() => onChange(val)}
          >
            <Icon size={13} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
