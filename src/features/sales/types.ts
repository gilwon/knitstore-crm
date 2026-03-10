export type SaleTypeFilter = 'all' | 'product_sale' | 'class_fee'

export interface SaleItemDetailExtended {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  // 상품 판매 필드
  lot_number?: string
  product_name?: string
  brand?: string
  color_name?: string
  unit?: 'ball' | 'g'
  // 수강권 판매 필드
  subscription_type?: 'count' | 'period'
  subscription_total_count?: number | null
}

export interface SaleWithItemsExtended {
  id: string
  type: 'product_sale' | 'class_fee'
  total_amount: number
  student_id: string | null
  student_name?: string
  created_at: string
  items: SaleItemDetailExtended[]
}

export interface ProductRankItem {
  product_id: string
  product_name: string
  brand: string
  total_revenue: number
  total_quantity: number
  total_cost: number
  margin: number
  margin_rate: number
}

export interface SubscriptionBreakdownData {
  count_type_revenue: number
  count_type_count: number
  period_type_revenue: number
  period_type_count: number
  total_revenue: number
  total_count: number
}

export interface SalesStats {
  totalRevenue: number
  productRevenue: number
  classRevenue: number
  productRanking: ProductRankItem[]
  subscriptionBreakdown: SubscriptionBreakdownData
  totalMargin: number
  totalMarginRate: number
  dailyData: DailySalesData[]
}

export interface DailySalesData {
  date: string
  product: number
  class: number
}
