import { createClient } from '@/lib/supabase/client'
import type { KPIData, DailySalesData, TodayAttendance, AlertItem } from './types'

function dateRange(date: Date) {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate()
  return {
    from: new Date(y, m, d, 0, 0, 0, 0).toISOString(),
    to: new Date(y, m, d, 23, 59, 59, 999).toISOString(),
  }
}

export async function fetchDashboardKPI(): Promise<KPIData> {
  const supabase = createClient()
  const now = new Date()

  // 오늘/어제 범위
  const today = dateRange(now)
  const yesterday = dateRange(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  // 이달/전달 범위
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString()

  const [todaySales, yesterdaySales, monthSales, prevMonthSales, students, products] = await Promise.all([
    supabase.from('sales').select('total_amount').gte('created_at', today.from).lte('created_at', today.to),
    supabase.from('sales').select('total_amount').gte('created_at', yesterday.from).lte('created_at', yesterday.to),
    supabase.from('sales').select('total_amount').gte('created_at', monthStart),
    supabase.from('sales').select('total_amount').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabase.from('students').select('id, subscriptions(status)', { count: 'exact' }),
    supabase.from('products').select('alert_threshold, lots(stock_quantity)'),
  ])

  const sumAmount = (rows: { total_amount: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + r.total_amount, 0)

  const todayRev = sumAmount(todaySales.data)
  const yesterdayRev = sumAmount(yesterdaySales.data)
  const monthRev = sumAmount(monthSales.data)
  const prevMonthRev = sumAmount(prevMonthSales.data)

  const studentData = (students.data ?? []) as unknown as { id: string; subscriptions: { status: string }[] }[]
  const activeStudents = studentData.filter((s) =>
    s.subscriptions?.some((sub) => sub.status === 'active')
  ).length

  const productData = (products.data ?? []) as unknown as { alert_threshold: number; lots: { stock_quantity: number }[] }[]
  const lowStockCount = productData.filter((p) => {
    const total = p.lots?.reduce((s, l) => s + l.stock_quantity, 0) ?? 0
    return p.alert_threshold > 0 && total <= p.alert_threshold
  }).length

  return {
    todayRevenue: todayRev,
    todaySalesCount: todaySales.data?.length ?? 0,
    monthRevenue: monthRev,
    monthSalesCount: monthSales.data?.length ?? 0,
    activeStudents,
    totalStudents: students.count ?? studentData.length,
    lowStockCount,
    todayRevenueChange: yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : null,
    monthRevenueChange: prevMonthRev > 0 ? Math.round(((monthRev - prevMonthRev) / prevMonthRev) * 100) : null,
  }
}

export async function fetchWeeklySales(): Promise<DailySalesData[]> {
  const supabase = createClient()
  const now = new Date()
  const days: string[] = ['일', '월', '화', '수', '목', '금', '토']
  const result: DailySalesData[] = []

  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  const { data: sales } = await supabase
    .from('sales')
    .select('total_amount, created_at')
    .gte('created_at', weekAgo.toISOString())

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
    const dayStr = days[d.getDay()]
    const daySales = (sales ?? []).filter((s) => {
      const sd = new Date(s.created_at)
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate()
    })
    result.push({
      date: dateStr,
      day: dayStr,
      amount: daySales.reduce((s, r) => s + r.total_amount, 0),
      count: daySales.length,
    })
  }
  return result
}

export async function fetchTodayAttendance(): Promise<TodayAttendance[]> {
  const supabase = createClient()
  const now = new Date()
  const { from, to } = dateRange(now)

  const { data } = await supabase
    .from('attendances')
    .select('attended_at, student:students(name), subscription:subscriptions(type)')
    .gte('attended_at', from)
    .lte('attended_at', to)
    .order('attended_at', { ascending: false })
    .limit(10)

  return (data ?? []).map((a) => ({
    studentName: (a.student as unknown as { name: string })?.name ?? '알 수 없음',
    subscriptionType: (a.subscription as unknown as { type: string })?.type as 'count' | 'period' ?? 'count',
    attendedAt: a.attended_at,
  }))
}

export async function fetchActionAlerts(): Promise<AlertItem[]> {
  const supabase = createClient()
  const alerts: AlertItem[] = []

  // 재고 부족
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, alert_threshold, lots(stock_quantity)')

  for (const p of (products ?? []) as unknown as { id: string; name: string; brand: string; alert_threshold: number; lots: { stock_quantity: number }[] }[]) {
    const total = p.lots?.reduce((s, l) => s + l.stock_quantity, 0) ?? 0
    if (p.alert_threshold > 0 && total <= p.alert_threshold) {
      alerts.push({
        type: 'low_stock',
        title: `${p.brand ? p.brand + ' ' : ''}${p.name}`,
        description: `잔여 ${total}개 (기준 ${p.alert_threshold})`,
        href: `/inventory/${p.id}`,
      })
    }
  }

  // 만료 임박 수강권 (7일 이내)
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, expires_at, student:students(id, name)')
    .eq('status', 'active')
    .eq('type', 'period')
    .lte('expires_at', sevenDaysLater.toISOString())

  for (const sub of (subs ?? []) as unknown as { id: string; expires_at: string; student: { id: string; name: string } }[]) {
    const daysLeft = Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000)
    alerts.push({
      type: 'expiring_sub',
      title: sub.student?.name ?? '알 수 없음',
      description: daysLeft <= 0 ? '기간 만료' : `기간제 수강권 ${daysLeft}일 남음`,
      href: `/students/${sub.student?.id}`,
    })
  }

  return alerts
}
