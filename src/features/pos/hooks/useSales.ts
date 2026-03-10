'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface SaleItemDetail {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  lot_number: string
  product_name: string
  brand: string
  color_name: string
  unit: 'ball' | 'g'
}

export interface SaleWithItems {
  id: string
  type: 'product_sale' | 'class_fee'
  total_amount: number
  student_id: string | null
  created_at: string
  items: SaleItemDetail[]
}

export function useSales(shopId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['sales', shopId, from, to],
    enabled: !!shopId,
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('sales')
        .select(`
          id, type, total_amount, student_id, created_at,
          sale_items (
            id, quantity, unit_price, subtotal,
            lots (
              lot_number,
              products ( name, brand, color_name, unit )
            )
          )
        `)
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })

      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data, error } = await query
      if (error) throw error

      // 중첩 타입 평탄화
      return (data ?? []).map((sale) => ({
        id: sale.id,
        type: sale.type as 'product_sale' | 'class_fee',
        total_amount: sale.total_amount,
        student_id: sale.student_id,
        created_at: sale.created_at,
        items: (sale.sale_items ?? []).map((si: any) => ({
          id: si.id,
          quantity: si.quantity,
          unit_price: si.unit_price,
          subtotal: si.subtotal,
          lot_number: si.lots?.lot_number ?? '',
          product_name: si.lots?.products?.name ?? '',
          brand: si.lots?.products?.brand ?? '',
          color_name: si.lots?.products?.color_name ?? '',
          unit: (si.lots?.products?.unit ?? 'ball') as 'ball' | 'g',
        })),
      })) as SaleWithItems[]
    },
  })
}
