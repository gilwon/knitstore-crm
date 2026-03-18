'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { CartItem, PaymentMethod } from '../types'

interface CheckoutInput {
  shopId: string
  items: CartItem[]
  studentId?: string | null
  paymentMethod?: PaymentMethod
  discountAmount?: number
  discountType?: string | null
  discountRate?: number | null
  originalAmount?: number
}

export function useCheckout() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      shopId, items, studentId,
      paymentMethod = 'card',
      discountAmount = 0,
      discountType,
      discountRate,
      originalAmount,
    }: CheckoutInput) => {
      const supabase = createClient()

      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      const totalAmount = Math.max(0, subtotal - discountAmount)

      // 1. 판매 레코드 생성
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          shop_id: shopId,
          type: 'product_sale',
          total_amount: totalAmount,
          student_id: studentId ?? null,
          payment_method: paymentMethod,
          discount_amount: discountAmount,
          discount_type: discountType ?? null,
          discount_rate: discountRate ?? null,
          original_amount: originalAmount ?? subtotal,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // 2. 각 항목 처리 (sale_item 생성 → process_stock_out)
      for (const item of items) {
        const { data: saleItem, error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            lot_id: item.lotId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })
          .select()
          .single()

        if (itemError) throw itemError

        const { error: stockError } = await supabase.rpc('process_stock_out', {
          p_lot_id: item.lotId,
          p_quantity: item.quantity,
          p_reason: 'sale',
          p_memo: null,
          p_sale_item_id: saleItem.id,
        })

        if (stockError) throw stockError
      }

      return sale
    },
    onSuccess: () => {
      toast.success('결제가 완료되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : '결제 처리에 실패했습니다'
      toast.error(msg)
    },
  })
}
