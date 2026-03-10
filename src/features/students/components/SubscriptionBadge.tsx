import { Badge } from '@/components/ui/badge'
import type { Subscription } from '@/types/database'

interface SubscriptionBadgeProps {
  subscription: Subscription | null
}

function getLabel(sub: Subscription): string {
  if (sub.type === 'count') {
    return `잔여 ${sub.remaining ?? 0}회`
  }
  if (sub.expires_at) {
    const diff = Math.ceil(
      (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return diff >= 0 ? `D-${diff}` : '만료'
  }
  return '기간제'
}

function getVariant(
  sub: Subscription
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (sub.type === 'count') {
    if ((sub.remaining ?? 0) === 0) return 'destructive'
    if ((sub.remaining ?? 0) <= 2) return 'secondary'
    return 'default'
  }
  if (sub.expires_at) {
    const diff = Math.ceil(
      (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (diff < 0) return 'destructive'
    if (diff <= 7) return 'secondary'
    return 'default'
  }
  return 'default'
}

export function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  if (!subscription) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        수강권 없음
      </Badge>
    )
  }

  return (
    <Badge variant={getVariant(subscription)} className="text-xs">
      {getLabel(subscription)}
    </Badge>
  )
}
