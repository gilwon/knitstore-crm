'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useShopSettings() {
  return useQuery({
    queryKey: ['shop', 'settings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (error) throw error
      return { shop: data, email: user.email ?? '' }
    },
  })
}

export function useUpdateShopName() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId, name }: { shopId: string; name: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('shops')
        .update({ name })
        .eq('id', shopId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('공방명이 수정되었습니다')
      qc.invalidateQueries({ queryKey: ['shop'] })
    },
    onError: () => toast.error('공방명 수정에 실패했습니다'),
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const supabase = createClient()

      // 현재 비밀번호 확인 (재로그인 시도)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('이메일을 확인할 수 없습니다')

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyError) throw new Error('현재 비밀번호가 올바르지 않습니다')

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => toast.success('비밀번호가 변경되었습니다'),
    onError: (error: Error) => toast.error(error.message || '비밀번호 변경에 실패했습니다'),
  })
}

export function useUpdateSmartstoreKeys() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId, clientId, clientSecret }: { shopId: string; clientId: string; clientSecret: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('shops')
        .update({ smartstore_client_id: clientId, smartstore_client_secret: clientSecret })
        .eq('id', shopId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop'] })
      qc.invalidateQueries({ queryKey: ['shop', 'settings'] })
      toast.success('스마트스토어 API 키가 저장되었습니다')
    },
    onError: () => {
      toast.error('API 키 저장에 실패했습니다')
    },
  })
}
