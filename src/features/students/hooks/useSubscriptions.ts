'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

export interface CreateSubscriptionInput {
  student_id: string
  shop_id: string
  type: 'count' | 'period'
  total_count?: number
  starts_at: string
  expires_at?: string
  price: number
}

export interface UpdateSubscriptionInput {
  id: string
  student_id: string
  type: 'count' | 'period'
  total_count?: number
  remaining?: number
  starts_at: string
  expires_at?: string
  price: number
  status: 'active' | 'expired' | 'exhausted'
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSubscriptionInput) => {
      const supabase = createClient()
      const payload: Database['public']['Tables']['subscriptions']['Update'] = {
        type: input.type,
        starts_at: input.starts_at,
        price: input.price,
        status: input.status,
        total_count: input.type === 'count' ? (input.total_count ?? null) : null,
        remaining: input.type === 'count' ? (input.remaining ?? null) : null,
        expires_at: input.type === 'period' ? (input.expires_at ?? null) : null,
      }
      const { data, error } = await supabase
        .from('subscriptions')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      toast.success('수강권이 수정되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', vars.student_id] })
    },
    onError: () => toast.error('수강권 수정에 실패했습니다'),
  })
}

export function useDeleteSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) throw error
      return studentId
    },
    onSuccess: (studentId) => {
      toast.success('수강권이 삭제되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', studentId] })
    },
    onError: () => toast.error('수강권 삭제에 실패했습니다'),
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSubscriptionInput) => {
      const supabase = createClient()
      const payload: SubscriptionInsert = {
        student_id: input.student_id,
        type: input.type,
        starts_at: input.starts_at,
        price: input.price,
        status: 'active',
        total_count: input.type === 'count' ? (input.total_count ?? null) : null,
        remaining: input.type === 'count' ? (input.total_count ?? null) : null,
        expires_at: input.type === 'period' ? (input.expires_at ?? null) : null,
      }
      const { data: subscription, error: subError } = await supabase.from('subscriptions').insert(payload).select().single()
      if (subError) throw subError

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          shop_id: input.shop_id,
          type: 'class_fee',
          total_amount: input.price,
          student_id: input.student_id,
        })
        .select()
        .single()
      if (saleError) throw saleError

      const { error: itemError } = await supabase.from('sale_items').insert({
        sale_id: sale.id,
        subscription_id: subscription.id,
        quantity: 1,
        unit_price: input.price,
        subtotal: input.price,
      })
      if (itemError) throw itemError

      return subscription
    },
    onSuccess: (_, vars) => {
      toast.success('수강권이 등록되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', vars.student_id] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: () => toast.error('수강권 등록에 실패했습니다'),
  })
}
