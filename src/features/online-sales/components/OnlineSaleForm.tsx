'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateOnlineSale, useUpdateOnlineSale } from '../hooks/useOnlineSales'
import { calcOnlineSale } from '../utils/calc'
import type { OnlineSale, PackagingTemplate } from '../types'

const schema = z.object({
  sale_date: z.string().min(1, '판매일을 입력하세요'),
  order_number: z.string(),
  product_name: z.string().min(1, '상품명을 입력하세요'),
  sale_amount: z.coerce.number().int().min(1, '판매금액을 입력하세요'),
  shipping_income: z.coerce.number().int().min(0, '0 이상'),
  order_fee: z.coerce.number().int().min(0, '0 이상'),
  sales_fee: z.coerce.number().int().min(0, '0 이상'),
  vat: z.coerce.number().int().min(0, '0 이상'),
  product_cost: z.coerce.number().int().min(0, '0 이상'),
  material_cost: z.coerce.number().int().min(0, '0 이상'),
  packaging_cost: z.coerce.number().int().min(0, '0 이상'),
  shipping_cost: z.coerce.number().int().min(0, '0 이상'),
  memo: z.string(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editSale?: OnlineSale | null
  packagingTemplates?: PackagingTemplate[]
}

const today = () => new Date().toISOString().split('T')[0]

const defaultValues: FormValues = {
  sale_date: today(),
  order_number: '',
  product_name: '',
  sale_amount: 0,
  shipping_income: 0,
  order_fee: 0,
  sales_fee: 0,
  vat: 0,
  product_cost: 0,
  material_cost: 0,
  packaging_cost: 0,
  shipping_cost: 0,
  memo: '',
}

export function OnlineSaleForm({ shopId, open, onOpenChange, editSale, packagingTemplates = [] }: Props) {
  const createMutation = useCreateOnlineSale()
  const updateMutation = useUpdateOnlineSale()
  const isEdit = !!editSale

  const { register, handleSubmit, watch, setValue, reset, trigger, formState: { errors } } = useForm<FormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema) as never,
    defaultValues: editSale
      ? {
          sale_date: editSale.sale_date,
          order_number: editSale.order_number,
          product_name: editSale.product_name,
          sale_amount: editSale.sale_amount,
          shipping_income: editSale.shipping_income,
          order_fee: editSale.order_fee,
          sales_fee: editSale.sales_fee,
          vat: editSale.vat,
          product_cost: editSale.product_cost,
          material_cost: editSale.material_cost,
          packaging_cost: editSale.packaging_cost,
          shipping_cost: editSale.shipping_cost,
          memo: editSale.memo || '',
        }
      : defaultValues,
  })

  useEffect(() => {
    if (editSale) {
      reset({
        sale_date: editSale.sale_date,
        order_number: editSale.order_number,
        product_name: editSale.product_name,
        sale_amount: editSale.sale_amount,
        shipping_income: editSale.shipping_income,
        order_fee: editSale.order_fee,
        sales_fee: editSale.sales_fee,
        vat: editSale.vat,
        product_cost: editSale.product_cost,
        material_cost: editSale.material_cost,
        packaging_cost: editSale.packaging_cost,
        shipping_cost: editSale.shipping_cost,
        memo: editSale.memo || '',
      })
    } else {
      reset(defaultValues)
    }
  }, [editSale, reset])

  const watchAll = watch()

  // 원가 자동 반영 (포장비 + 실원가 + 부자재원가 각각 템플릿에서)
  const productName = watch('product_name')
  useEffect(() => {
    if (isEdit || !productName) return
    for (const tpl of packagingTemplates) {
      if (tpl.product_name !== productName) continue
      if (tpl.type === 'packaging') setValue('packaging_cost', tpl.total_cost)
      else if (tpl.type === 'product_cost') setValue('product_cost', tpl.total_cost)
      else if (tpl.type === 'material_cost') setValue('material_cost', tpl.total_cost)
    }
  }, [productName, packagingTemplates, setValue, isEdit])

  // 실시간 계산
  const calc = useMemo(() => {
    return calcOnlineSale({
      sale_amount: Number(watchAll.sale_amount) || 0,
      shipping_income: Number(watchAll.shipping_income) || 0,
      order_fee: Number(watchAll.order_fee) || 0,
      sales_fee: Number(watchAll.sales_fee) || 0,
      vat: Number(watchAll.vat) || 0,
      product_cost: Number(watchAll.product_cost) || 0,
      material_cost: Number(watchAll.material_cost) || 0,
      packaging_cost: Number(watchAll.packaging_cost) || 0,
      shipping_cost: Number(watchAll.shipping_cost) || 0,
    } as OnlineSale)
  }, [watchAll])

  const onSubmit = async (values: FormValues) => {
    if (isEdit && editSale) {
      await updateMutation.mutateAsync({
        id: editSale.id,
        input: { ...values },
      })
    } else {
      await createMutation.mutateAsync({
        shop_id: shopId,
        ...values,
      })
    }
    reset(defaultValues)
    onOpenChange(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '판매 수정' : '판매 등록'}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault()
              const input = e.target as HTMLInputElement
              const form = e.currentTarget
              const name = input.name as keyof FormValues
              if (name) {
                const valid = await trigger(name)
                if (!valid) return
              }
              const inputs = Array.from(form.querySelectorAll<HTMLElement>('input, select, textarea'))
              const idx = inputs.indexOf(input)
              if (idx >= 0 && idx < inputs.length - 1) inputs[idx + 1].focus()
            }
          }}
          className="flex flex-col gap-4 px-4"
        >
          {/* 기본 정보 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>판매일 *</Label>
                <Input type="date" {...register('sale_date')} />
                {errors.sale_date && <p className="text-xs text-destructive mt-1">{errors.sale_date.message}</p>}
              </div>
              <div>
                <Label>주문번호</Label>
                <Input {...register('order_number')} placeholder="주문번호" />
              </div>
            </div>
            <div>
              <Label>상품명 *</Label>
              <Input {...register('product_name')} placeholder="상품명" list="pkg-templates" />
              <datalist id="pkg-templates">
                {packagingTemplates.map((t) => (
                  <option key={t.id} value={t.product_name} />
                ))}
              </datalist>
              {errors.product_name && <p className="text-xs text-destructive mt-1">{errors.product_name.message}</p>}
            </div>
          </fieldset>

          {/* 수입 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">수입</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>판매금액 *</Label>
                <Input type="number" {...register('sale_amount')} />
                {errors.sale_amount && <p className="text-xs text-destructive mt-1">{errors.sale_amount.message}</p>}
              </div>
              <div>
                <Label>택배비(수입)</Label>
                <Input type="number" {...register('shipping_income')} />
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              합계: <span className="font-medium text-foreground">{calc.totalIncome.toLocaleString()}원</span>
            </div>
          </fieldset>

          {/* 수수료 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">수수료</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>주문관리수수료</Label>
                <Input type="number" {...register('order_fee')} />
              </div>
              <div>
                <Label>매출연동수수료</Label>
                <Input type="number" {...register('sales_fee')} />
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              수수료합계: <span className="font-medium text-foreground">{calc.totalFee.toLocaleString()}원</span>
            </div>
          </fieldset>

          {/* 세금 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">세금</legend>
            <div>
              <Label>부가세</Label>
              <Input type="number" {...register('vat')} />
            </div>
          </fieldset>

          {/* 원가 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">원가</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>실원가</Label>
                <Input type="number" {...register('product_cost')} />
              </div>
              <div>
                <Label>부자재원가</Label>
                <Input type="number" {...register('material_cost')} />
              </div>
              <div>
                <Label>포장비</Label>
                <Input type="number" {...register('packaging_cost')} />
              </div>
              <div>
                <Label>택배비(비용)</Label>
                <Input type="number" {...register('shipping_cost')} />
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              원가합계: <span className="font-medium text-foreground">{calc.totalCost.toLocaleString()}원</span>
            </div>
          </fieldset>

          {/* 비고 */}
          <div>
            <Label>비고</Label>
            <Textarea {...register('memo')} placeholder="메모" rows={2} />
          </div>

          {/* 계산 결과 */}
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">이익</span>
              <span className={`font-bold ${calc.profit >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {calc.profit.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">마진율</span>
              <span className={`font-bold ${calc.marginRate >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {calc.marginRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? '저장 중...' : isEdit ? '수정' : '등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
