'use client'

import { DollarSign, TrendingUp, TrendingDown, Percent, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  totalRevenue: number
  totalProfit: number
  avgMarginRate: number
  saleCount: number
}

export function ProfitSummaryCards({ totalRevenue, totalProfit, avgMarginRate, saleCount }: Props) {
  const cards = [
    {
      label: '총 매출',
      value: `${totalRevenue.toLocaleString()}원`,
      icon: DollarSign,
      color: '',
    },
    {
      label: '총 이익',
      value: `${totalProfit.toLocaleString()}원`,
      icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
      color: totalProfit < 0 ? 'text-destructive' : '',
    },
    {
      label: '평균 마진율',
      value: `${avgMarginRate.toFixed(1)}%`,
      icon: Percent,
      color: avgMarginRate < 0 ? 'text-destructive' : '',
    },
    {
      label: '판매 건수',
      value: `${saleCount}건`,
      icon: ShoppingBag,
      color: '',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <card.icon size={13} strokeWidth={1.8} />
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
