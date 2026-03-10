'use client'

import { useEffect } from 'react'
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
import { useCreateSubscription } from '../hooks/useSubscriptions'

const schema = z.object({
  type: z.enum(['count', 'period']),
  total_count: z.number().int().min(1).optional(),
  starts_at: z.string().min(1, '시작일을 선택하세요'),
  expires_at: z.string().optional(),
  price: z.number().int().min(0),
})

type FormValues = z.infer<typeof schema>

interface SubscriptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  studentName: string
}

const today = new Date().toISOString().slice(0, 10)

export function SubscriptionForm({ open, onOpenChange, studentId, studentName }: SubscriptionFormProps) {
  const createSub = useCreateSubscription()

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'count', total_count: 8, starts_at: today, price: 0 },
  })

  const subType = watch('type')

  useEffect(() => {
    if (open) {
      reset({ type: 'count', total_count: 8, starts_at: today, price: 0 })
    }
  }, [open, reset])

  async function onSubmit(values: FormValues) {
    if (values.type === 'count') {
      await createSub.mutateAsync({
        student_id: studentId,
        type: 'count',
        total_count: values.total_count ?? 1,
        starts_at: values.starts_at,
        price: values.price,
      })
    } else {
      await createSub.mutateAsync({
        student_id: studentId,
        type: 'period',
        starts_at: values.starts_at,
        expires_at: values.expires_at,
        price: values.price,
      })
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>수강권 등록 — {studentName}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          {/* 수강권 종류 */}
          <div className="space-y-1">
            <Label>수강권 종류</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => {
                  field.onChange(v)
                  reset({ type: v as 'count' | 'period', starts_at: today, price: 0, ...(v === 'count' ? { total_count: 8 } : { expires_at: '' }) })
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {field.value === 'count' ? '횟수제' : '기간제'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">횟수제</SelectItem>
                    <SelectItem value="period">기간제</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Separator />

          {/* 횟수제 */}
          {subType === 'count' && (
            <div className="space-y-1">
              <Label>총 횟수</Label>
              <Input
                type="number"
                min={1}
                {...register('total_count', { valueAsNumber: true })}
              />
              {errors.total_count && (
                <p className="text-xs text-destructive">{errors.total_count.message}</p>
              )}
            </div>
          )}

          {/* 기간제 종료일 */}
          {subType === 'period' && (
            <div className="space-y-1">
              <Label>종료일 *</Label>
              <Input type="date" {...register('expires_at')} />
              {errors.expires_at && (
                <p className="text-xs text-destructive">{errors.expires_at.message}</p>
              )}
            </div>
          )}

          {/* 시작일 */}
          <div className="space-y-1">
            <Label>시작일 *</Label>
            <Input type="date" {...register('starts_at')} />
            {errors.starts_at && <p className="text-xs text-destructive">{errors.starts_at.message}</p>}
          </div>

          {/* 수강료 */}
          <div className="space-y-1">
            <Label>수강료 (원)</Label>
            <Input type="number" min={0} {...register('price', { valueAsNumber: true })} />
          </div>

          <SheetFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '수강권 등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
