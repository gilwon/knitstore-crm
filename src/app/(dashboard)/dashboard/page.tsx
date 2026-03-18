'use client'

import Link from 'next/link'
import {
  Package, Users, ShoppingCart, Receipt, TrendingUp,
  AlertTriangle, ArrowRight, BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useShop } from '@/features/inventory/hooks/useShop'
import { KPICard } from '@/features/dashboard/components/KPICard'
import { WeeklySalesChart } from '@/features/dashboard/components/WeeklySalesChart'
import { RecentAttendance } from '@/features/dashboard/components/RecentAttendance'
import { ActionAlerts } from '@/features/dashboard/components/ActionAlerts'
import { useDashboardKPI } from '@/features/dashboard/hooks/useDashboardKPI'
import { OnboardingChecklist } from '@/features/settings/components/OnboardingChecklist'

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
  const { data: kpi } = useDashboardKPI()

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

        {/* 온보딩 체크리스트 (미완료 시만 표시) */}
        <OnboardingChecklist />

        {/* KPI 카드 4개 (증감률 포함) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            icon={TrendingUp}
            title="오늘 매출"
            value={(kpi?.todayRevenue ?? 0).toLocaleString()}
            unit="원"
            subtitle={`${kpi?.todaySalesCount ?? 0}건`}
            change={kpi?.todayRevenueChange}
          />
          <KPICard
            icon={Receipt}
            title="이달 매출"
            value={(kpi?.monthRevenue ?? 0).toLocaleString()}
            unit="원"
            subtitle={`${kpi?.monthSalesCount ?? 0}건`}
            change={kpi?.monthRevenueChange}
          />
          <KPICard
            icon={BookOpen}
            title="활성 수강생"
            value={String(kpi?.activeStudents ?? 0)}
            unit="명"
            subtitle={`전체 ${kpi?.totalStudents ?? 0}명`}
          />
          <KPICard
            icon={AlertTriangle}
            title="재고 부족"
            value={String(kpi?.lowStockCount ?? 0)}
            unit="종"
            subtitle={(kpi?.lowStockCount ?? 0) > 0 ? '확인 필요' : '정상'}
            highlight={(kpi?.lowStockCount ?? 0) > 0}
          />
        </div>

        {/* 주간 매출 차트 + 오늘 출석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeeklySalesChart />
          <RecentAttendance />
        </div>

        {/* 조치 필요 알림 */}
        <ActionAlerts />

        {/* 빠른 실행 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">빠른 실행</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
                    <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
