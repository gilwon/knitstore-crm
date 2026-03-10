'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SaleTypeFilter, SaleWithItemsExtended } from '../types'

export function useSalesWithSubs(
  shopId: string | undefined,
  from?: string,
  to?: string,
  typeFilter: SaleTypeFilter = 'all'
) {
  return useQuery({
    queryKey: ['salesWithSubs', shopId, from, to, typeFilter],
    enabled: !!shopId,
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('sales')
        .select(`
          id, type, total_amount, student_id, created_at,
          students ( name ),
          sale_items (
            id, quantity, unit_price, subtotal,
            lots (
              lot_number,
              products ( name, brand, color_name, unit, purchase_price )
            ),
            subscriptions (
              type, total_count, price
            )
          )
        `)
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((sale): SaleWithItemsExtended => ({
        id: sale.id,
        type: sale.type as 'product_sale' | 'class_fee',
        total_amount: sale.total_amount,
        student_id: sale.student_id,
        student_name: (sale.students as any)?.name ?? undefined,
        created_at: sale.created_at,
        items: (sale.sale_items ?? []).map((si: any) => ({
          id: si.id,
          quantity: si.quantity,
          unit_price: si.unit_price,
          subtotal: si.subtotal,
          lot_number: si.lots?.lot_number ?? undefined,
          product_name: si.lots?.products?.name ?? undefined,
          brand: si.lots?.products?.brand ?? undefined,
          color_name: si.lots?.products?.color_name ?? undefined,
          unit: si.lots?.products?.unit ?? undefined,
          subscription_type: si.subscriptions?.type ?? undefined,
          subscription_total_count: si.subscriptions?.total_count ?? undefined,
        })),
      }))
    },
  })
}
