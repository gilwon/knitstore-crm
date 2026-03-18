'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingStatus } from '../types'

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async (): Promise<OnboardingStatus> => {
      const supabase = createClient()

      const [shop, products, students, sales] = await Promise.all([
        supabase.from('shops').select('name').limit(1).single(),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('id', { count: 'exact', head: true }),
      ])

      const shopProfileCompleted = !!(shop.data?.name && shop.data.name.trim() !== '')
      const firstProductAdded = (products.count ?? 0) > 0
      const firstStudentAdded = (students.count ?? 0) > 0
      const firstSaleCompleted = (sales.count ?? 0) > 0

      const items = [shopProfileCompleted, firstProductAdded, firstStudentAdded, firstSaleCompleted]
      const completedCount = items.filter(Boolean).length

      return {
        shopProfileCompleted,
        firstProductAdded,
        firstStudentAdded,
        firstSaleCompleted,
        completedCount,
        totalCount: 4,
        allCompleted: completedCount === 4,
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (shopId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('shops')
        .update({ onboarding_completed: true } as any)
        .eq('id', shopId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-status'] })
      qc.invalidateQueries({ queryKey: ['shop'] })
    },
  })
}
