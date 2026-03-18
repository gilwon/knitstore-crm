'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { StudentWithSub, StudentWithDetails, StudentFilterState } from '../types'

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

      const now = new Date()
      const expiredIds: string[] = []

      const result = (data ?? []).map((s) => {
        const subs = (s.subscriptions ?? []) as import('@/types/database').Subscription[]

        // FR-02: 기간제 수강권 만료 자동 처리
        const processedSubs = subs.map((sub) => {
          if (
            sub.status === 'active' &&
            sub.type === 'period' &&
            sub.expires_at &&
            new Date(sub.expires_at) < now
          ) {
            expiredIds.push(sub.id)
            return { ...sub, status: 'expired' as const }
          }
          return sub
        })

        const active = processedSubs.find((sub) => sub.status === 'active') ?? null
        return { ...s, subscriptions: processedSubs, activeSubscription: active } as StudentWithSub
      })

      // 만료된 수강권 DB 업데이트 (fire-and-forget)
      if (expiredIds.length > 0) {
        supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .in('id', expiredIds)
          .then(() => {})
      }

      return result
    },
  })
}

export function filterAndSortStudents(
  students: StudentWithSub[],
  filters: StudentFilterState,
): StudentWithSub[] {
  let result = students

  // 검색
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.phone ?? '').includes(q)
    )
  }

  // 수강권 상태 필터
  if (filters.subscriptionStatus !== 'all') {
    result = result.filter((s) => {
      const subs = s.subscriptions ?? []
      if (filters.subscriptionStatus === 'none') {
        return subs.length === 0 || !subs.some((sub) => sub.status === 'active')
      }
      return subs.some((sub) => sub.status === filters.subscriptionStatus)
    })
  }

  // 정렬
  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case 'recent_attendance': {
        const hasActive = (s: StudentWithSub) =>
          (s.subscriptions ?? []).some((sub) => sub.status === 'active') ? 1 : 0
        const diff = hasActive(b) - hasActive(a)
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko')
      }
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return a.name.localeCompare(b.name, 'ko')
    }
  })

  return result
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
