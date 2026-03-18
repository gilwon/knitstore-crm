export interface CartItem {
  productId: string
  productName: string
  brand: string
  colorName: string
  unit: 'ball' | 'g'
  lotId: string
  lotNumber: string
  unitPrice: number
  quantity: number
  maxStock: number
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'
export type DiscountType = 'fixed' | 'rate'

export interface ItemDiscount {
  lotId: string
  type: DiscountType
  value: number  // fixed: 원, rate: %
  reason?: string
}

export interface OrderDiscount {
  type: DiscountType
  value: number
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
  other: '기타',
}
