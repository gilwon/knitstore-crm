'use client'

import { useEffect, useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

const schema = z.object({
  brand: z.string().max(50),
  name: z.string().min(1, '상품명을 입력해주세요').max(100),
  color_code: z.string().max(20),
  color_name: z.string().max(50),
  unit: z.enum(['ball', 'g']),
  price: z.number().int().min(0),
  alert_threshold: z.number().int().min(0),
})

type FormValues = z.infer<typeof schema>

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  editProduct?: Product | null
}

export function ProductForm({ open, onOpenChange, shopId, editProduct }: ProductFormProps) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isEdit = !!editProduct

  // 초기 입고 필드 (zod 스키마 외 별도 관리 — optional number 처리)
  const [initLotNumber, setInitLotNumber] = useState('')
  const [initQuantity, setInitQuantity] = useState('')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: '',
      name: '',
      color_code: '',
      color_name: '',
      unit: 'ball',
      price: 0,
      alert_threshold: 0,
    },
  })

  useEffect(() => {
    if (editProduct) {
      reset({
        brand: editProduct.brand,
        name: editProduct.name,
        color_code: editProduct.color_code,
        color_name: editProduct.color_name,
        unit: editProduct.unit,
        price: editProduct.price,
        alert_threshold: editProduct.alert_threshold,
      })
    } else {
      reset()
      setInitLotNumber('')
      setInitQuantity('')
    }
  }, [editProduct, reset])

  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      if (isEdit && editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, ...values })
      } else {
        const product = await createProduct.mutateAsync({ shop_id: shopId, ...values })

        // 초기 입고: 로트번호와 수량이 모두 입력된 경우
        const qty = Number(initQuantity)
        if (initLotNumber.trim() && qty > 0 && product) {
          const supabase = createClient()
          const { data: lot, error: lotError } = await supabase
            .from('lots')
            .insert({ product_id: product.id, lot_number: initLotNumber.trim() })
            .select()
            .single()

          if (lotError) {
            toast.error('로트 생성 실패: ' + lotError.message)
          } else {
            const { error: stockError } = await supabase.rpc('process_stock_in', {
              p_lot_id: lot.id,
              p_quantity: qty,
              p_reason: 'purchase',
              p_memo: null,
            })
            if (stockError) {
              toast.error('초기 입고 실패: ' + stockError.message)
            } else {
              toast.success(`초기 입고 완료 (${qty}${values.unit === 'ball' ? '볼' : 'g'})`)
            }
          }
        }
      }
      reset()
      setInitLotNumber('')
      setInitQuantity('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isPending = submitting || updateProduct.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '상품 수정' : '상품 등록'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          {/* 상품명 */}
          <div className="space-y-1">
            <Label>상품명 *</Label>
            <Input placeholder="예: 코튼골드" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* 브랜드 */}
          <div className="space-y-1">
            <Label>브랜드</Label>
            <Input placeholder="예: 알리제" {...register('brand')} />
          </div>

          {/* 색상 코드 / 색상명 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>색상 번호</Label>
              <Input placeholder="예: #101" {...register('color_code')} />
            </div>
            <div className="space-y-1">
              <Label>색상명</Label>
              <Input placeholder="예: 레드" {...register('color_name')} />
            </div>
          </div>

          {/* 단위 */}
          <div className="space-y-1">
            <Label>재고 단위</Label>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ball">볼 (ball)</SelectItem>
                    <SelectItem value="g">g (그램)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 단가 / 알림 임계값 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>판매 단가 (원)</Label>
              <Input type="number" min={0} {...register('price', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>재고 부족 알림</Label>
              <Input type="number" min={0} placeholder="0=미사용" {...register('alert_threshold', { valueAsNumber: true })} />
            </div>
          </div>

          {/* 초기 입고 섹션 (신규 등록 시에만) */}
          {!isEdit && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">초기 입고 <span className="text-muted-foreground font-normal">(선택)</span></p>
                <p className="text-xs text-muted-foreground">입력하면 상품 등록과 동시에 재고가 추가됩니다.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>로트 번호</Label>
                  <Input
                    placeholder="예: LOT-2026-A"
                    value={initLotNumber}
                    onChange={(e) => setInitLotNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>수량</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="0"
                    value={initQuantity}
                    onChange={(e) => setInitQuantity(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <SheetFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? '처리 중...' : isEdit ? '수정 완료' : '상품 등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
