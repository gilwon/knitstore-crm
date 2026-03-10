'use client'

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
import { useStockOut } from '../hooks/useLots'
import { STOCK_OUT_REASONS } from '../types'
import type { Product, Lot } from '@/types/database'

const schema = z.object({
  lot_id: z.string().min(1, '로트를 선택해주세요'),
  quantity: z.number().int().min(1, '수량은 1 이상이어야 합니다'),
  reason: z.string().min(1),
  memo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface StockOutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  lots: Lot[]
  defaultLotId?: string
}

export function StockOutSheet({
  open,
  onOpenChange,
  product,
  lots,
  defaultLotId,
}: StockOutSheetProps) {
  const stockOut = useStockOut()
  const availableLots = lots.filter((l) => l.stock_quantity > 0)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lot_id: defaultLotId ?? '',
      reason: 'sale',
      quantity: undefined,
    },
  })

  async function onSubmit(values: FormValues) {
    await stockOut.mutateAsync({
      lot_id: values.lot_id,
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
          <SheetTitle>출고 등록</SheetTitle>
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {field.value
                        ? (() => {
                            const lot = availableLots.find((l) => l.id === field.value)
                            return lot
                              ? `${lot.lot_number} (현재고: ${lot.stock_quantity}${product.unit === 'ball' ? '볼' : 'g'})`
                              : '로트 선택'
                          })()
                        : '로트 선택'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableLots.length === 0 ? (
                      <SelectItem value="" disabled>재고 있는 로트 없음</SelectItem>
                    ) : (
                      availableLots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.lot_number} (현재고: {lot.stock_quantity}{product.unit === 'ball' ? '볼' : 'g'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lot_id && <p className="text-xs text-destructive">{errors.lot_id.message}</p>}
          </div>

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
            <Label>출고 사유</Label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {STOCK_OUT_REASONS.find((r) => r.value === field.value)?.label ?? '선택하세요'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_OUT_REASONS.map((r) => (
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
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={stockOut.isPending || availableLots.length === 0}
            >
              {stockOut.isPending ? '처리 중...' : '출고 등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
