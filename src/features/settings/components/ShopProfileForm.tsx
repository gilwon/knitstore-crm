'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, '공방명을 입력하세요'),
  phone: z.string().optional(),
  address: z.string().optional(),
  business_hours: z.string().optional(),
  business_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ShopProfileFormProps {
  shopId: string
  shop: {
    name: string
    phone?: string | null
    address?: string | null
    business_hours?: string | null
    business_number?: string | null
  }
}

export function ShopProfileForm({ shopId, shop }: ShopProfileFormProps) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: shop.name,
      phone: shop.phone ?? '',
      address: shop.address ?? '',
      business_hours: shop.business_hours ?? '',
      business_number: shop.business_number ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: shop.name,
      phone: shop.phone ?? '',
      address: shop.address ?? '',
      business_hours: shop.business_hours ?? '',
      business_number: shop.business_number ?? '',
    })
  }, [shop, reset])

  const updateProfile = useMutation({
    mutationFn: async (values: FormValues) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('shops')
        .update({
          name: values.name,
          phone: values.phone || null,
          address: values.address || null,
          business_hours: values.business_hours || null,
          business_number: values.business_number || null,
        } as any)
        .eq('id', shopId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('매장 정보가 저장되었습니다')
      qc.invalidateQueries({ queryKey: ['shop'] })
      qc.invalidateQueries({ queryKey: ['shop', 'settings'] })
      qc.invalidateQueries({ queryKey: ['onboarding-status'] })
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">매장 프로필</CardTitle>
        <CardDescription>공방/매장 정보를 관리합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => updateProfile.mutateAsync(v))} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">공방명 *</Label>
            <Input id="profile-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">연락처</Label>
            <Input id="profile-phone" {...register('phone')} placeholder="02-1234-5678" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-address">주소</Label>
            <Input id="profile-address" {...register('address')} placeholder="서울시 강남구..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-hours">영업시간</Label>
            <Input id="profile-hours" {...register('business_hours')} placeholder="월-금 10:00-19:00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-bn">사업자등록번호</Label>
            <Input id="profile-bn" {...register('business_number')} placeholder="123-45-67890" />
          </div>
          <Button type="submit" disabled={!isDirty || isSubmitting || updateProfile.isPending}>
            {updateProfile.isPending ? '저장 중...' : '매장 정보 저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
