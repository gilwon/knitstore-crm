'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { StudentWithSub, StudentWithDetails } from '../types'

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('students')
        .select('*, subscriptions(*)')
        .order('name', { ascending: true })

      if (error) throw error

      return (data ?? []).map((s) => {
        const subs = (s.subscriptions ?? []) as import('@/types/database').Subscription[]
        const active = subs.find((sub) => sub.status === 'active') ?? null
        return { ...s, activeSubscription: active } as StudentWithSub
      })
    },
  })
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('students')
        .select('*, subscriptions(*), attendances(*, subscription:subscriptions(type))')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as unknown as StudentWithDetails
    },
    enabled: !!id,
  })
}

interface StudentInput {
  shop_id: string
  name: string
  phone?: string
  memo?: string
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.from('students').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('수강생이 등록되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
    },
    onError: () => toast.error('수강생 등록에 실패했습니다'),
  })
}

interface UpdateStudentInput {
  id: string
  name?: string
  phone?: string | null
  memo?: string | null
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStudentInput) => {
      const supabase = createClient()
      const { error } = await supabase.from('students').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success('수강생 정보가 수정되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', vars.id] })
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('수강생이 삭제되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })
}
