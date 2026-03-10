'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SalesStats, ProductRankItem, SubscriptionBreakdownData, DailySalesData } from '../types'

function toDateKey(isoStr: string): string {
  const d = new Date(isoStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export function useSalesStats(shopId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['salesStats', shopId, from, to],
    enabled: !!shopId,
    queryFn: async () => {
      const supabase = createClient()

      // 1. 상품 판매 데이터
      let productQuery = supabase
        .from('sales')
        .select(`
          id, total_amount, created_at,
          sale_items (
            quantity, subtotal,
            lots (
              products ( id, name, brand, purchase_price )
            )
          )
        `)
        .eq('shop_id', shopId!)
        .eq('type', 'product_sale')
        .order('created_at', { ascending: true })

      if (from) productQuery = productQuery.gte('created_at', from)
      if (to) productQuery = productQuery.lte('created_at', to)

      // 2. 수강권 판매 데이터
      let classQuery = supabase
        .from('sales')
        .select(`
          id, total_amount, created_at,
          sale_items (
            quantity, subtotal,
            subscriptions ( type, total_count )
          )
        `)
        .eq('shop_id', shopId!)
        .eq('type', 'class_fee')
        .order('created_at', { ascending: true })

      if (from) classQuery = classQuery.gte('created_at', from)
      if (to) classQuery = classQuery.lte('created_at', to)

      const [{ data: productSales, error: pe }, { data: classSales, error: ce }] =
        await Promise.all([productQuery, classQuery])

      if (pe) throw pe
      if (ce) throw ce

      // 집계 계산
      const productRevenue = (productSales ?? []).reduce((s, r) => s + r.total_amount, 0)
      const classRevenue = (classSales ?? []).reduce((s, r) => s + r.total_amount, 0)
      const totalRevenue = productRevenue + classRevenue

      // 상품별 랭킹 + 마진
      const rankMap = new Map<string, ProductRankItem>()
      for (const sale of productSales ?? []) {
        for (const si of (sale.sale_items ?? []) as any[]) {
          const prod = si.lots?.products
          if (!prod) continue
          const existing = rankMap.get(prod.id)
          const cost = si.quantity * (prod.purchase_price ?? 0)
          if (existing) {
            existing.total_revenue += si.subtotal
            existing.total_quantity += si.quantity
            existing.total_cost += cost
            existing.margin = existing.total_revenue - existing.total_cost
            existing.margin_rate =
              existing.total_revenue > 0 ? (existing.margin / existing.total_revenue) * 100 : 0
          } else {
            const margin = si.subtotal - cost
            rankMap.set(prod.id, {
              product_id: prod.id,
              product_name: prod.name,
              brand: prod.brand ?? '',
              total_revenue: si.subtotal,
              total_quantity: si.quantity,
              total_cost: cost,
              margin,
              margin_rate: si.subtotal > 0 ? (margin / si.subtotal) * 100 : 0,
            })
          }
        }
      }
      const productRanking = Array.from(rankMap.values()).sort(
        (a, b) => b.total_revenue - a.total_revenue
      )

      const totalCost = productRanking.reduce((s, r) => s + r.total_cost, 0)
      const totalMargin = productRevenue - totalCost
      const totalMarginRate = productRevenue > 0 ? (totalMargin / productRevenue) * 100 : 0

      // 수강권 배분
      const breakdown: SubscriptionBreakdownData = {
        count_type_revenue: 0,
        count_type_count: 0,
        period_type_revenue: 0,
        period_type_count: 0,
        total_revenue: classRevenue,
        total_count: (classSales ?? []).length,
      }
      for (const sale of classSales ?? []) {
        for (const si of (sale.sale_items ?? []) as any[]) {
          const subType = si.subscriptions?.type
          if (subType === 'count') {
            breakdown.count_type_revenue += si.subtotal
            breakdown.count_type_count += 1
          } else if (subType === 'period') {
            breakdown.period_type_revenue += si.subtotal
            breakdown.period_type_count += 1
          }
        }
      }

      // 일별 추이
      const dailyMap = new Map<string, DailySalesData>()
      for (const sale of productSales ?? []) {
        const key = toDateKey(sale.created_at)
        const existing = dailyMap.get(key) ?? { date: key, product: 0, class: 0 }
        existing.product += sale.total_amount
        dailyMap.set(key, existing)
      }
      for (const sale of classSales ?? []) {
        const key = toDateKey(sale.created_at)
        const existing = dailyMap.get(key) ?? { date: key, product: 0, class: 0 }
        existing.class += sale.total_amount
        dailyMap.set(key, existing)
      }
      const dailyData = Array.from(dailyMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      )

      return {
        totalRevenue,
        productRevenue,
        classRevenue,
        productRanking,
        subscriptionBreakdown: breakdown,
        totalMargin,
        totalMarginRate,
        dailyData,
      } satisfies SalesStats
    },
  })
}
