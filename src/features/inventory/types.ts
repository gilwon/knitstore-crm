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

export type StockStatus = 'all' | 'normal' | 'low' | 'out'
export type UnitFilter = 'all' | 'ball' | 'g'
export type ProductSortBy = 'name' | 'stock' | 'price' | 'created_at'

export interface InventoryFilterState {
  brand: string
  stockStatus: StockStatus
  unit: UnitFilter
  sortBy: ProductSortBy
  search: string
}

export function getStockStatus(product: ProductWithLots): 'normal' | 'low' | 'out' {
  const totalStock = product.lots.reduce((sum, lot) => sum + lot.stock_quantity, 0)
  if (totalStock === 0) return 'out'
  if (product.alert_threshold > 0 && totalStock <= product.alert_threshold) return 'low'
  return 'normal'
}

export function getTotalStock(product: ProductWithLots): number {
  return product.lots.reduce((sum, lot) => sum + lot.stock_quantity, 0)
}
