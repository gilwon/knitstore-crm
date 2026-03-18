'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, UserX, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useActionAlerts } from '../hooks/useActionAlerts'
import type { AlertItem } from '../types'

const alertIcons = {
  low_stock: AlertTriangle,
  expiring_sub: Clock,
  inactive_student: UserX,
}

const alertColors = {
  low_stock: 'text-amber-600 dark:text-amber-400',
  expiring_sub: 'text-orange-600 dark:text-orange-400',
  inactive_student: 'text-muted-foreground',
}

export function ActionAlerts() {
  const { data: alerts, isLoading } = useActionAlerts()

  if (isLoading || !alerts || alerts.length === 0) return null

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} /> 조치 필요 ({alerts.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pb-4">
        {alerts.slice(0, 6).map((alert, i) => {
          const Icon = alertIcons[alert.type]
          const color = alertColors[alert.type]
          return (
            <Link
              key={i}
              href={alert.href}
              className="flex items-center justify-between gap-2 text-sm hover:bg-amber-100/50 dark:hover:bg-amber-950/30 rounded px-2 py-1.5 -mx-2 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon size={13} className={color} />
                <span className="font-medium truncate">{alert.title}</span>
                <span className="text-xs text-muted-foreground truncate">{alert.description}</span>
              </div>
              <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
            </Link>
          )
        })}
        {alerts.length > 6 && (
          <p className="text-xs text-muted-foreground px-2">+{alerts.length - 6}건 더</p>
        )}
      </CardContent>
    </Card>
  )
}
