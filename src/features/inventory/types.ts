import type { Product, Lot } from '@/types/database'

export type ProductWithLots = Product & { lots: Lot[] }

export const STOCK_IN_REASONS = [
  { value: 'purchase', label: '구매입고' },
  { value: 'return', label: '반품입고' },
  { value: 'adjustment', label: '재고조정' },
] as const

export const STOCK_OUT_REASONS = [
  { value: 'sale', label: '판매출고' },
  { value: 'disposal', label: '폐기' },
  { value: 'adjustment', label: '재고조정' },
] as const
