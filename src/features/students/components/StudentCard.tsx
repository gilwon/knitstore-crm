'use client'

import Link from 'next/link'
import { Phone, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StudentWithSub } from '../types'

interface StudentCardProps {
  student: StudentWithSub
  onEdit: () => void
}

function subLabel(student: StudentWithSub) {
  const sub = student.activeSubscription
  if (!sub) return null
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

function subVariant(student: StudentWithSub): 'default' | 'secondary' | 'destructive' | 'outline' {
  const sub = student.activeSubscription
  if (!sub) return 'outline'
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

export function StudentCard({ student, onEdit }: StudentCardProps) {
  const label = subLabel(student)
  const variant = subVariant(student)

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="py-3 flex items-center gap-3">
        <Link href={`/students/${student.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{student.name}</span>
            {label ? (
              <Badge variant={variant} className="shrink-0 text-xs">{label}</Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">수강권 없음</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {student.phone && (
              <span className="flex items-center gap-1">
                <Phone size={10} />
                {student.phone}
              </span>
            )}
            {student.activeSubscription && (
              <span className="flex items-center gap-1">
                <BookOpen size={10} />
                {student.activeSubscription.type === 'count' ? '횟수제' : '기간제'}
              </span>
            )}
          </div>
        </Link>
        <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={onEdit}>
          수정
        </Button>
      </CardContent>
    </Card>
  )
}
