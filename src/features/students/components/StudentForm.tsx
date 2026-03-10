'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateStudent, useUpdateStudent } from '../hooks/useStudents'
import type { Student } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50),
  phone: z.string().max(20).optional(),
  memo: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  editStudent?: Student | null
}

export function StudentForm({ open, onOpenChange, shopId, editStudent }: StudentFormProps) {
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const isEdit = !!editStudent

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', memo: '' },
  })

  useEffect(() => {
    if (open) {
      reset(editStudent
        ? { name: editStudent.name, phone: editStudent.phone ?? '', memo: editStudent.memo ?? '' }
        : { name: '', phone: '', memo: '' }
      )
    }
  }, [open, editStudent, reset])

  async function onSubmit(values: FormValues) {
    const phone = values.phone?.trim() || null
    const memo = values.memo?.trim() || null

    if (isEdit && editStudent) {
      await updateStudent.mutateAsync({ id: editStudent.id, name: values.name, phone, memo })
    } else {
      await createStudent.mutateAsync({ shop_id: shopId, name: values.name, phone: phone ?? undefined, memo: memo ?? undefined })
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '수강생 수정' : '수강생 등록'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          <div className="space-y-1">
            <Label>이름 *</Label>
            <Input placeholder="이름을 입력하세요" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>연락처</Label>
            <Input placeholder="010-0000-0000" {...register('phone')} />
          </div>

          <div className="space-y-1">
            <Label>메모</Label>
            <Textarea
              placeholder="특이사항, 진행 중인 작품 등..."
              className="resize-none"
              rows={3}
              {...register('memo')}
            />
          </div>

          <SheetFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : isEdit ? '수정 완료' : '수강생 등록'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
