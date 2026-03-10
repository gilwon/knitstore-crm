'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAttend } from '../hooks/useAttendance'
import type { Subscription } from '@/types/database'

interface AttendanceButtonProps {
  studentId: string
  studentName: string
  subscriptions: Subscription[]
}

const today = new Date().toISOString().slice(0, 10)

export function AttendanceButton({ studentId, studentName, subscriptions }: AttendanceButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedSubId, setSelectedSubId] = useState<string>('')
  const [attendedAt, setAttendedAt] = useState<string>(today)
  const attend = useAttend()

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')

  if (activeSubscriptions.length === 0) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1.5">
        <CheckCircle size={14} />
        출석 체크
      </Button>
    )
  }

  function handleOpen() {
    setSelectedSubId(activeSubscriptions.length === 1 ? activeSubscriptions[0].id : '')
    setAttendedAt(today)
    setOpen(true)
  }

  async function handleConfirm() {
    const subId = selectedSubId || activeSubscriptions[0].id
    await attend.mutateAsync({
      studentId,
      subscriptionId: subId,
      attendedAt,
    })
    setOpen(false)
  }

  const selectedSub = activeSubscriptions.find((s) => s.id === selectedSubId) ?? activeSubscriptions[0]

  function subLabel(sub: Subscription) {
    if (sub.type === 'count') return `횟수제 (잔여 ${sub.remaining ?? 0}회)`
    if (sub.expires_at) return `기간제 (~${new Date(sub.expires_at).toLocaleDateString('ko-KR')})`
    return '기간제'
  }

  return (
    <>
      <Button size="sm" variant="default" className="gap-1.5" onClick={handleOpen}>
        <CheckCircle size={14} />
        출석 체크
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>출석 체크 확인</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">수강생</span>
              <span className="font-medium">{studentName}</span>
            </div>

            {/* 수강권 선택 (복수일 때) */}
            {activeSubscriptions.length > 1 ? (
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">수강권 선택</Label>
                <Select value={selectedSubId} onValueChange={(v) => setSelectedSubId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="수강권을 선택하세요">
                      {selectedSubId
                        ? subLabel(activeSubscriptions.find((s) => s.id === selectedSubId)!)
                        : '수강권을 선택하세요'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeSubscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {subLabel(sub)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">수강권</span>
                <Badge variant="secondary">{subLabel(selectedSub)}</Badge>
              </div>
            )}

            {/* 출석일 선택 */}
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">출석일</Label>
              <Input
                type="date"
                value={attendedAt}
                onChange={(e) => setAttendedAt(e.target.value)}
                max={today}
              />
            </div>

            {selectedSub.type === 'count' && (
              <p className="text-xs text-muted-foreground">
                출석 후 잔여 횟수: {(selectedSub.remaining ?? 0) - 1}회
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>취소</Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={attend.isPending || (activeSubscriptions.length > 1 && !selectedSubId)}
            >
              {attend.isPending ? '처리 중...' : '출석 확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
