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
