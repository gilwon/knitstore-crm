import { createClient } from '@/lib/supabase/client'
import type { ProductWithLots } from './types'
import type { StockMovement } from '@/types/database'

export type MovementWithLot = StockMovement & { lot_number: string }

export async function fetchProducts(): Promise<ProductWithLots[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, lots(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ProductWithLots[]
}

export async function fetchProduct(id: string): Promise<ProductWithLots> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, lots(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as ProductWithLots
}

export async function fetchShop() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', authData.user.id)
    .single()
  if (error) throw error
  return data
}

export async function fetchProductMovements(productId: string): Promise<MovementWithLot[]> {
  const supabase = createClient()
  const { data: lots } = await supabase
    .from('lots')
    .select('id, lot_number')
    .eq('product_id', productId)
  if (!lots || lots.length === 0) return []

  const lotIds = lots.map((l) => l.id)
  const lotMap = Object.fromEntries(lots.map((l) => [l.id, l.lot_number]))
  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('*')
    .in('lot_id', lotIds)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (movements ?? []).map((m) => ({
    ...m,
    lot_number: lotMap[m.lot_id] ?? '-',
  })) as MovementWithLot[]
}

export async function createProduct(product: {
  shop_id: string
  brand: string
  name: string
  color_code: string
  color_name: string
  unit: 'ball' | 'g'
  price: number
  alert_threshold: number
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, updates: {
  brand?: string
  name?: string
  color_code?: string
  color_name?: string
  unit?: 'ball' | 'g'
  price?: number
  alert_threshold?: number
}) {
  const supabase = createClient()
  const { error } = await supabase.from('products').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function processStockIn(params: {
  lot_id?: string
  product_id?: string
  lot_number?: string
  quantity: number
  reason: string
  memo: string | null
}) {
  const supabase = createClient()
  let lotId = params.lot_id

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
}

export async function processStockOut(params: {
  lot_id: string
  quantity: number
  reason: string
  memo: string | null
}) {
  const supabase = createClient()
  const { error } = await supabase.rpc('process_stock_out', {
    p_lot_id: params.lot_id,
    p_quantity: params.quantity,
    p_reason: params.reason,
    p_memo: params.memo,
  })
  if (error) throw error
}
