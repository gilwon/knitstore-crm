'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

export interface CreateSubscriptionInput {
  student_id: string
  type: 'count' | 'period'
  total_count?: number
  starts_at: string
  expires_at?: string
  price: number
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
      const { data, error } = await supabase.from('subscriptions').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      toast.success('수강권이 등록되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', vars.student_id] })
    },
    onError: () => toast.error('수강권 등록에 실패했습니다'),
  })
}
