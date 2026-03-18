export interface KPIData {
  todayRevenue: number
  todaySalesCount: number
  monthRevenue: number
  monthSalesCount: number
  activeStudents: number
  totalStudents: number
  lowStockCount: number
  // 증감률
  todayRevenueChange: number | null  // 전일 대비 %
  monthRevenueChange: number | null  // 전월 대비 %
}

export interface DailySalesData {
  date: string   // 'MM/DD'
  day: string    // '월'
  amount: number
  count: number
}

export interface TodayAttendance {
  studentName: string
  subscriptionType: 'count' | 'period'
  attendedAt: string
}

export interface AlertItem {
  type: 'low_stock' | 'expiring_sub' | 'inactive_student'
  title: string
  description: string
  href: string
}
