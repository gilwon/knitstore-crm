'use client'

import Link from 'next/link'
import {
  Package,
  Users,
  ShoppingCart,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useShop } from '@/features/inventory/hooks/useShop'
import { useProducts } from '@/features/inventory/hooks/useProducts'
import { useStudents } from '@/features/students/hooks/useStudents'
import { useSalesWithSubs } from '@/features/sales/hooks/useSalesWithSubs'

function getTodayRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  return {
    from: new Date(y, m, d, 0, 0, 0, 0).toISOString(),
    to: new Date(y, m, d, 23, 59, 59, 999).toISOString(),
  }
}

function getMonthRange() {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString(),
  }
}

function getDateLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

const quickActions = [
  {
    href: '/pos',
    icon: ShoppingCart,
    label: 'POS 판매',
    description: '상품 및 수강권 판매',
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  },
  {
    href: '/inventory',
    icon: Package,
    label: '재고 관리',
    description: '상품 등록 및 입출고',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  {
    href: '/students',
    icon: Users,
    label: '수강생 관리',
    description: '수강생 및 수강권',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    href: '/sales',
    icon: Receipt,
    label: '판매 내역',
    description: '판매 기록 및 통계',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  },
]

export default function DashboardPage() {
  const { data: shop } = useShop()
  const { data: products = [] } = useProducts()
  const { data: students = [] } = useStudents()

  const { from: todayFrom, to: todayTo } = getTodayRange()
  const { from: monthFrom } = getMonthRange()

  const { data: todaySales = [] } = useSalesWithSubs(shop?.id, todayFrom, todayTo)
  const { data: monthSales = [] } = useSalesWithSubs(shop?.id, monthFrom)

  // 집계
  const todayRevenue = todaySales.reduce((s, sale) => s + sale.total_amount, 0)
  const monthRevenue = monthSales.reduce((s, sale) => s + sale.total_amount, 0)
  const activeStudents = students.filter((s) => s.activeSubscription).length
  const lowStockProducts = products.filter((p) => {
    const total = p.lots?.reduce((s: number, l: any) => s + l.stock_quantity, 0) ?? 0
    return total <= p.alert_threshold
  })

  const recentSales = todaySales.slice(0, 5)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 w-full space-y-6">

        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {shop?.name ?? '공방'} 대시보드
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{getDateLabel()}</p>
        </div>

        {/* 통계 카드 4개 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={11} /> 오늘 매출
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-xl font-bold tabular-nums">
                {todayRevenue.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">원</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{todaySales.length}건</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Receipt size={11} /> 이달 매출
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-xl font-bold tabular-nums">
                {monthRevenue.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">원</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{monthSales.length}건</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <BookOpen size={11} /> 활성 수강생
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-xl font-bold tabular-nums">
                {activeStudents}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">명</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">전체 {students.length}명</p>
            </CardContent>
          </Card>

          <Card className={lowStockProducts.length > 0 ? 'border-amber-300 dark:border-amber-700' : ''}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle size={11} /> 재고 부족
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className={`text-xl font-bold tabular-nums ${lowStockProducts.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                {lowStockProducts.length}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">종</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lowStockProducts.length > 0 ? '확인 필요' : '정상'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 하단 2열 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 빠른 실행 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">빠른 실행</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {quickActions.map(({ href, icon: Icon, label, description, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 오늘 판매 내역 */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">오늘 판매 내역</CardTitle>
              <Link
                href="/sales"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                전체 보기 <ArrowRight size={11} />
              </Link>
            </CardHeader>
            <CardContent className="pb-4">
              {recentSales.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  오늘 판매 내역이 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSales.map((sale) => {
                    const timeStr = new Date(sale.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const summary =
                      sale.type === 'product_sale'
                        ? sale.items.map((i) => i.product_name).filter(Boolean).join(', ') || '상품'
                        : sale.items
                            .map((i) =>
                              i.subscription_type === 'count'
                                ? `횟수권 ${i.subscription_total_count ?? ''}회`
                                : '기간권'
                            )
                            .join(', ') || '수강권'

                    return (
                      <div key={sale.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">{timeStr}</span>
                          <span className="truncate">{summary}</span>
                          <Badge
                            variant={sale.type === 'class_fee' ? 'default' : 'secondary'}
                            className="text-xs shrink-0"
                          >
                            {sale.type === 'class_fee' ? '수강권' : '상품'}
                          </Badge>
                        </div>
                        <span className="font-semibold shrink-0 tabular-nums">
                          {sale.total_amount.toLocaleString()}원
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 재고 부족 경고 (있을 때만) */}
        {lowStockProducts.length > 0 && (
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle size={14} /> 재고 부족 알림
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-1.5">
              {lowStockProducts.slice(0, 4).map((p) => {
                const total = p.lots?.reduce((s: number, l: any) => s + l.stock_quantity, 0) ?? 0
                return (
                  <Link
                    key={p.id}
                    href={`/inventory/${p.id}`}
                    className="flex items-center justify-between text-sm hover:underline"
                  >
                    <span className="text-amber-800 dark:text-amber-300">
                      {p.brand && <span className="text-xs opacity-70 mr-1">{p.brand}</span>}
                      {p.name}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      잔여 {total}{p.unit === 'ball' ? '볼' : 'g'} / 기준 {p.alert_threshold}
                    </span>
                  </Link>
                )
              })}
              {lowStockProducts.length > 4 && (
                <Link href="/inventory" className="text-xs text-amber-600 hover:underline">
                  +{lowStockProducts.length - 4}개 더 보기
                </Link>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
