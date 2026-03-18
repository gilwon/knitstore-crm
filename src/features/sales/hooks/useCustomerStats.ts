'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CustomerRankItem {
  studentId: string
  studentName: string
  totalSpent: number
  purchaseCount: number
  lastPurchase: string
}

export function useCustomerStats(shopId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['customerStats', shopId, from, to],
    enabled: !!shopId,
    queryFn: async (): Promise<CustomerRankItem[]> => {
      const supabase = createClient()

      let query = supabase
        .from('sales')
        .select('total_amount, created_at, student_id, student:students(name)')
        .eq('shop_id', shopId!)
        .not('student_id', 'is', null)

      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data, error } = await query
      if (error) throw error

      const map = new Map<string, CustomerRankItem>()
      for (const sale of data ?? []) {
        if (!sale.student_id) continue
        const name = (sale.student as unknown as { name: string })?.name ?? '알 수 없음'
        const existing = map.get(sale.student_id)
        if (existing) {
          existing.totalSpent += sale.total_amount
          existing.purchaseCount++
          if (sale.created_at > existing.lastPurchase) existing.lastPurchase = sale.created_at
        } else {
          map.set(sale.student_id, {
            studentId: sale.student_id,
            studentName: name,
            totalSpent: sale.total_amount,
            purchaseCount: 1,
            lastPurchase: sale.created_at,
          })
        }
      }

      return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent)
    },
  })
}
