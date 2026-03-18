'use client'

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KPICardProps {
  icon: LucideIcon
  title: string
  value: string
  unit: string
  subtitle: string
  change?: number | null
  highlight?: boolean
}

export function KPICard({ icon: Icon, title, value, unit, subtitle, change, highlight }: KPICardProps) {
  return (
    <Card className={highlight ? 'border-amber-300 dark:border-amber-700' : ''}>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon size={11} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        <div className="flex items-baseline gap-1">
          <p className={`text-xl font-bold tabular-nums ${highlight ? 'text-amber-600 dark:text-amber-400' : ''}`}>
            {value}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
          </p>
          {change != null && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ml-1 ${change >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
