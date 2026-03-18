'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RefundInput {
  saleId: string
  shopId: string
  refundAmount: number
  reason?: string
  refundedItems: { lot_id: string | null; quantity: number; subtotal: number }[]
  paymentMethod?: string
}

export function useRefund() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ saleId, shopId, refundAmount, reason, refundedItems, paymentMethod }: RefundInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('process_refund', {
        p_sale_id: saleId,
        p_shop_id: shopId,
        p_refund_amount: refundAmount,
        p_reason: reason ?? null,
        p_refunded_items: JSON.stringify(refundedItems),
        p_payment_method: paymentMethod ?? null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('환불이 처리되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('환불 처리에 실패했습니다'),
  })
}
