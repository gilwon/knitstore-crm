'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useAttend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      studentId,
      subscriptionId,
      memo,
    }: {
      studentId: string
      subscriptionId: string
      memo?: string
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('process_attendance', {
        p_student_id: studentId,
        p_subscription_id: subscriptionId,
        p_memo: memo ?? null,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      toast.success('출석이 체크되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', vars.studentId] })
    },
    onError: (err: Error) => toast.error(err.message ?? '출석 체크에 실패했습니다'),
  })
}
