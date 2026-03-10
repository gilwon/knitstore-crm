'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAttend } from '../hooks/useAttendance'
import type { Subscription } from '@/types/database'

interface AttendanceButtonProps {
  studentId: string
  studentName: string
  activeSubscription: Subscription | null
}

export function AttendanceButton({ studentId, studentName, activeSubscription }: AttendanceButtonProps) {
  const [open, setOpen] = useState(false)
  const attend = useAttend()

  if (!activeSubscription) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1.5">
        <CheckCircle size={14} />
        출석 체크
      </Button>
    )
  }

  async function handleConfirm() {
    await attend.mutateAsync({
      studentId,
      subscriptionId: activeSubscription!.id,
    })
    setOpen(false)
  }

  const subInfo = activeSubscription.type === 'count'
    ? `잔여 ${activeSubscription.remaining ?? 0}회`
    : activeSubscription.expires_at
      ? `~${new Date(activeSubscription.expires_at).toLocaleDateString('ko-KR')}`
      : '기간제'

  return (
    <>
      <Button size="sm" variant="default" className="gap-1.5" onClick={() => setOpen(true)}>
        <CheckCircle size={14} />
        출석 체크
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>출석 체크 확인</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">수강생</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">수강권</span>
              <Badge variant="secondary">{subInfo}</Badge>
            </div>
            {activeSubscription.type === 'count' && (
              <p className="text-xs text-muted-foreground">
                출석 후 잔여 횟수: {(activeSubscription.remaining ?? 0) - 1}회
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleConfirm} disabled={attend.isPending}>
              {attend.isPending ? '처리 중...' : '출석 확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
