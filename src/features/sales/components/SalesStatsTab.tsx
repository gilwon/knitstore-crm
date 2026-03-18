'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, ShoppingBag, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useSalesStats } from '../hooks/useSalesStats'
import { useCustomerStats } from '../hooks/useCustomerStats'
import { ProductRanking } from './ProductRanking'
import { SubscriptionBreakdown } from './SubscriptionBreakdown'
import { MarginTable } from './MarginTable'
import { RevenueComposition } from './RevenueComposition'
import { CustomerRanking } from './CustomerRanking'
import { BrandMarginTable } from './BrandMarginTable'
import { calcGrowthRate, getPreviousPeriodRange } from '../utils/period'

interface Props {
  shopId: string
  from?: string
  to?: string
  dateRange: 'today' | 'week' | 'month' | 'all' | 'custom'
}

export function SalesStatsTab({ shopId, from, to, dateRange }: Props) {
  const { data: stats, isLoading } = useSalesStats(shopId, from, to)
  const { prevFrom, prevTo } = getPreviousPeriodRange(from, to)
  const { data: prevStats } = useSalesStats(shopId, prevFrom, prevTo)
  const { data: customers } = useCustomerStats(shopId, from, to)

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">통계 불러오는 중...</div>
    )
  }

  if (!stats) return null

  const revenueGrowth = prevStats ? calcGrowthRate(stats.totalRevenue, prevStats.totalRevenue) : null

  function GrowthBadge({ value }: { value: number | null }) {
    if (value == null) return null
    return (
      <span className={`text-xs font-medium flex items-center gap-0.5 ${value >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
        {value >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {value >= 0 ? '+' : ''}{value}%
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* 섹션 1: 매출 요약 카드 (성장률 배지 추가) */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={12} /> 전체 매출
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold">
                {stats.totalRevenue.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">원</span>
              </p>
              <GrowthBadge value={revenueGrowth} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag size={12} /> 상품 매출
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold">
                {stats.productRevenue.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">원</span>
              </p>
              <GrowthBadge value={prevStats ? calcGrowthRate(stats.productRevenue, prevStats.productRevenue) : null} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen size={12} /> 수강권 매출
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold">
                {stats.classRevenue.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">원</span>
              </p>
              <GrowthBadge value={prevStats ? calcGrowthRate(stats.classRevenue, prevStats.classRevenue) : null} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 섹션 2: 일별 매출 추이 (이번 달 선택 시만) */}
      {dateRange === 'month' && stats.dailyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">일별 매출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={stats.dailyData}
                margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${v}`
                  }
                  width={36}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(v, name) => [
                    `${Number(v).toLocaleString()}원`,
                    name === 'product' ? '상품' : '수강권',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'product' ? '상품' : '수강권')}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="product" name="product" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="class" name="class" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 섹션 3: 상품별 판매 랭킹 */}
      <ProductRanking items={stats.productRanking} />

      {/* 섹션 4: 수강권 유형별 배분율 */}
      <SubscriptionBreakdown data={stats.subscriptionBreakdown} />

      {/* 섹션 5: 마진 분석 */}
      <MarginTable
        items={stats.productRanking}
        totalMargin={stats.totalMargin}
        totalMarginRate={stats.totalMarginRate}
      />

      {/* 섹션 6: 매출 구성비 + 브랜드별 마진 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueComposition
          productRevenue={stats.productRevenue}
          classRevenue={stats.classRevenue}
        />
        <BrandMarginTable items={stats.productRanking} />
      </div>

      {/* 섹션 7: 고객별 구매 패턴 */}
      {customers && customers.length > 0 && (
        <CustomerRanking items={customers} />
      )}
    </div>
  )
}
