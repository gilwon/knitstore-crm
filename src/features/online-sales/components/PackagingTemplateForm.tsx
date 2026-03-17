'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreatePackagingTemplate, useUpdatePackagingTemplate } from '../hooks/usePackagingTemplates'
import type { PackagingTemplate } from '../types'

const schema = z.object({
  product_name: z.string().min(1, '상품명을 입력하세요'),
  items: z.array(z.object({
    name: z.string().min(1, '포장재명을 입력하세요'),
    cost: z.coerce.number().int().min(0, '0 이상'),
  })).min(1, '포장재를 1개 이상 추가하세요'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editTemplate?: PackagingTemplate | null
}

export function PackagingTemplateForm({ shopId, open, onOpenChange, editTemplate }: Props) {
  const createMutation = useCreatePackagingTemplate()
  const updateMutation = useUpdatePackagingTemplate()
  const isEdit = !!editTemplate

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema) as never,
    defaultValues: editTemplate
      ? { product_name: editTemplate.product_name, items: editTemplate.items as { name: string; cost: number }[] }
      : { product_name: '', items: [{ name: '', cost: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchItems = watch('items')
  const totalCost = watchItems?.reduce((sum, item) => sum + (Number(item.cost) || 0), 0) ?? 0

  const onSubmit = async (values: FormValues) => {
    const total = values.items.reduce((sum, item) => sum + item.cost, 0)
    if (isEdit && editTemplate) {
      await updateMutation.mutateAsync({
        id: editTemplate.id,
        input: { product_name: values.product_name, items: values.items, total_cost: total },
      })
    } else {
      await createMutation.mutateAsync({
        shop_id: shopId,
        product_name: values.product_name,
        items: values.items,
        total_cost: total,
      })
    }
    reset({ product_name: '', items: [{ name: '', cost: 0 }] })
    onOpenChange(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '포장 템플릿 수정' : '포장 템플릿 추가'}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault()
              const form = e.currentTarget
              const inputs = Array.from(form.querySelectorAll<HTMLElement>('input, select, textarea'))
              const idx = inputs.indexOf(e.target as HTMLElement)
              if (idx >= 0 && idx < inputs.length - 1) inputs[idx + 1].focus()
            }
          }}
          className="flex flex-col gap-4 px-4"
        >
          <div>
            <Label>상품명 *</Label>
            <Input {...register('product_name')} placeholder="예: 오메가" />
            {errors.product_name && <p className="text-xs text-destructive mt-1">{errors.product_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>포장재 구성 *</Label>
            {fields.map((field, index) => (
              <div key={field.id}>
                <div className="flex items-center gap-2">
                  <Input
                    {...register(`items.${index}.name`)}
                    placeholder="포장재명"
                    className="flex-1"
                  />
                  <Input
                    {...register(`items.${index}.cost`)}
                    type="number"
                    placeholder="단가"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">원</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <X size={14} />
                    </Button>
                  )}
                </div>
                {errors.items?.[index]?.name && (
                  <p className="text-xs text-destructive mt-1">{errors.items[index].name?.message}</p>
                )}
              </div>
            ))}
            {errors.items?.root && <p className="text-xs text-destructive">{errors.items.root.message}</p>}
            {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', cost: 0 })}>
              <Plus size={14} className="mr-1" /> 포장재 추가
            </Button>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">포장비 합계</p>
            <p className="text-lg font-bold">{totalCost.toLocaleString()}원</p>
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
