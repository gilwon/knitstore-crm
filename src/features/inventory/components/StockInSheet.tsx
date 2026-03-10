'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useStockIn } from '../hooks/useLots'
import { STOCK_IN_REASONS } from '../types'
import type { Product, Lot } from '@/types/database'

const NEW_LOT = '__new__'

const schema = z.object({
  lot_id: z.string().min(1, '로트를 선택해주세요'),
  new_lot_number: z.string().optional(),
  quantity: z.number().int().min(1, '수량은 1 이상이어야 합니다'),
  reason: z.string().min(1),
  memo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface StockInSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  lots: Lot[]
  defaultLotId?: string
}

export function StockInSheet({
  open,
  onOpenChange,
  product,
  lots,
  defaultLotId,
}: StockInSheetProps) {
  const stockIn = useStockIn()
  const [selectedLotId, setSelectedLotId] = useState<string>(defaultLotId ?? '')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lot_id: defaultLotId ?? '',
      reason: 'purchase',
      quantity: undefined,
    },
  })

  const isNewLot = selectedLotId === NEW_LOT

  async function onSubmit(values: FormValues) {
    await stockIn.mutateAsync({
      lot_id: isNewLot ? undefined : values.lot_id,
      product_id: isNewLot ? product.id : undefined,
      lot_number: isNewLot ? values.new_lot_number : undefined,
      quantity: values.quantity,
      reason: values.reason,
      memo: values.memo || null,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>입고 등록</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {product.brand} {product.name} · {product.color_name}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          {/* 로트 선택 */}
          <div className="space-y-1">
            <Label>로트</Label>
            <Controller
              control={control}
              name="lot_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setSelectedLotId(v ?? '')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedLotId === NEW_LOT
                        ? '+ 새 로트 번호 입력'
                        : selectedLotId
                          ? (() => {
                              const lot = lots.find((l) => l.id === selectedLotId)
                              return lot
                                ? `${lot.lot_number} (현재고: ${lot.stock_quantity}${product.unit === 'ball' ? '볼' : 'g'})`
                                : '로트 선택'
                            })()
                          : '로트 선택'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.lot_number} (현재고: {lot.stock_quantity}{product.unit === 'ball' ? '볼' : 'g'})
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_LOT}>+ 새 로트 번호 입력</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lot_id && <p className="text-xs text-destructive">{errors.lot_id.message}</p>}
          </div>

          {/* 새 로트 번호 입력 */}
          {isNewLot && (
            <div className="space-y-1">
              <Label>새 로트 번호</Label>
              <Input
                placeholder="예: LOT-2026-A"
                {...register('new_lot_number')}
              />
            </div>
          )}

          {/* 수량 */}
          <div className="space-y-1">
            <Label>수량 ({product.unit === 'ball' ? '볼' : 'g'})</Label>
            <Input
              type="number"
              min={1}
              placeholder="0"
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          {/* 사유 */}
          <div className="space-y-1">
            <Label>입고 사유</Label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {STOCK_IN_REASONS.find((r) => r.value === field.value)?.label ?? '선택하세요'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_IN_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label>메모 (선택)</Label>
            <Textarea
              placeholder="메모를 입력하세요"
              rows={2}
              {...register('memo')}
            />
          </div>

          <SheetFooter>
            <Button type="submit" className="w-full" disabled={stockIn.isPending}>
              {stockIn.isPending ? '처리 중...' : '입고 등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
