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
      attendedAt,
    }: {
      studentId: string
      subscriptionId: string
      memo?: string
      attendedAt?: string
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('process_attendance', {
        p_student_id: studentId,
        p_subscription_id: subscriptionId,
        p_memo: memo ?? null,
        p_attended_at: attendedAt ? new Date(attendedAt).toISOString() : null,
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

export function useUpdateAttendance(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, attendedAt, memo }: { id: string; attendedAt: string; memo?: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('attendances')
        .update({ attended_at: new Date(attendedAt).toISOString(), memo: memo ?? null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('출석 이력이 수정되었습니다')
      qc.invalidateQueries({ queryKey: ['students', studentId] })
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })
}

export function useDeleteAttendance(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_attendance', { p_attendance_id: attendanceId })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('출석 이력이 삭제되었습니다')
      qc.invalidateQueries({ queryKey: ['students', studentId] })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })
}
