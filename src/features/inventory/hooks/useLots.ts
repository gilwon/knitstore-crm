'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { StockMovement } from '@/types/database'

export type MovementWithLot = StockMovement & { lot_number: string }

// 새 로트 생성 후 입고까지 처리
export function useStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      lot_id?: string        // 기존 로트
      product_id?: string    // 새 로트 생성 시 필요
      lot_number?: string    // 새 로트 번호
      quantity: number
      reason: string
      memo: string | null
    }) => {
      const supabase = createClient()
      let lotId = params.lot_id

      // 새 로트 생성
      if (!lotId) {
        if (!params.product_id || !params.lot_number) {
          throw new Error('상품과 로트 번호를 입력해주세요')
        }
        const { data: newLot, error: lotError } = await supabase
          .from('lots')
          .insert({ product_id: params.product_id, lot_number: params.lot_number })
          .select()
          .single()
        if (lotError) {
          if (lotError.code === '23505') throw new Error('이미 존재하는 로트 번호입니다')
          throw lotError
        }
        lotId = newLot.id
      }

      const { error } = await supabase.rpc('process_stock_in', {
        p_lot_id: lotId,
        p_quantity: params.quantity,
        p_reason: params.reason,
        p_memo: params.memo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('입고가 완료되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '처리 중 오류가 발생했습니다')
    },
  })
}

export function useStockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      lot_id: string
      quantity: number
      reason: string
      memo: string | null
    }) => {
      const supabase = createClient()
      const { error } = await supabase.rpc('process_stock_out', {
        p_lot_id: params.lot_id,
        p_quantity: params.quantity,
        p_reason: params.reason,
        p_memo: params.memo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('출고가 완료되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error) => {
      if (error.message?.includes('INSUFFICIENT_STOCK')) {
        const match = error.message.match(/현재고\((\d+)\)/)
        const currentStock = match ? match[1] : null
        toast.error(currentStock ? `재고가 부족합니다 (현재고: ${currentStock})` : '재고가 부족합니다')
      } else {
        toast.error('처리 중 오류가 발생했습니다')
      }
    },
  })
}

export function useProductMovements(productId: string) {
  return useQuery({
    queryKey: ['movements', 'product', productId],
    queryFn: async () => {
      const supabase = createClient()
      const { data: lots } = await supabase
        .from('lots')
        .select('id, lot_number')
        .eq('product_id', productId)
      if (!lots || lots.length === 0) return [] as MovementWithLot[]

      const lotIds = lots.map((l) => l.id)
      const lotMap = Object.fromEntries(lots.map((l) => [l.id, l.lot_number]))
      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('*')
        .in('lot_id', lotIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (movements ?? []).map((m) => ({ ...m, lot_number: lotMap[m.lot_id] ?? '-' })) as MovementWithLot[]
    },
    enabled: !!productId,
  })
}
