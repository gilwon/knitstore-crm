import type { Database } from '@/types/database'

export type OnlineSale = Database['public']['Tables']['online_sales']['Row']
export type OnlineSaleInsert = Database['public']['Tables']['online_sales']['Insert']
export type OnlineSaleUpdate = Database['public']['Tables']['online_sales']['Update']

export type PackagingTemplate = Database['public']['Tables']['packaging_templates']['Row']
export type PackagingTemplateInsert = Database['public']['Tables']['packaging_templates']['Insert']
export type PackagingTemplateUpdate = Database['public']['Tables']['packaging_templates']['Update']

export interface PackagingItem {
  name: string
  cost: number
}

export interface OnlineSaleFormInput {
  sale_date: string
  order_number: string
  product_name: string
  sale_amount: number
  shipping_income: number
  order_fee: number
  sales_fee: number
  vat: number
  product_cost: number
  material_cost: number
  packaging_cost: number
  shipping_cost: number
  memo: string
}

export interface PackagingTemplateFormInput {
  product_name: string
  items: PackagingItem[]
}

export interface OnlineSaleCalc {
  totalIncome: number
  totalFee: number
  totalCost: number
  profit: number
  marginRate: number
}

export interface ProductProfitStat {
  product_name: string
  totalRevenue: number
  totalCost: number
  totalProfit: number
  marginRate: number
  count: number
}

export interface MonthlyProfitData {
  month: string
  revenue: number
  profit: number
}

// 네이버 커머스 API
export interface NaverOAuthToken {
  access_token: string
  expires_in: number
  token_type: string
}

export interface NaverProductOrder {
  productOrderId: string
  productName: string
  paymentDate: string
  totalPaymentAmount: number
  deliveryFeeAmount: number
  platformCommission: number
  salesCommission: number
  knowledgeShoppingCommission: number
  sellerBurdenDeliveryFee: number
}

export interface SyncResult {
  synced: number
  skipped: number
  total: number
  errors: string[]
}
