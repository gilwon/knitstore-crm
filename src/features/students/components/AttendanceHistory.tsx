'use client'

import { useState } from 'react'
import { CalendarCheck, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateAttendance, useDeleteAttendance } from '../hooks/useAttendance'
import type { StudentWithDetails } from '../types'

type AttendanceRow = StudentWithDetails['attendances'][number]

interface AttendanceHistoryProps {
  attendances: StudentWithDetails['attendances']
  studentId: string
}

export function AttendanceHistory({ attendances, studentId }: AttendanceHistoryProps) {
  const [editTarget, setEditTarget] = useState<AttendanceRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRow | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editMemo, setEditMemo] = useState('')

  const updateAtt = useUpdateAttendance(studentId)
  const deleteAtt = useDeleteAttendance(studentId)

  const today = new Date().toISOString().slice(0, 10)

  function openEdit(att: AttendanceRow) {
    setEditTarget(att)
    setEditDate(att.attended_at.slice(0, 10))
    setEditMemo(att.memo ?? '')
  }

  async function handleUpdate() {
    if (!editTarget) return
    await updateAtt.mutateAsync({ id: editTarget.id, attendedAt: editDate, memo: editMemo })
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteAtt.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (attendances.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <CalendarCheck size={28} className="opacity-30" />
        <p className="text-sm">출석 이력이 없습니다</p>
      </div>
    )
  }

  const sorted = [...attendances].sort(
    (a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime()
  )

  return (
    <>
      <div className="divide-y">
        {sorted.map((att) => (
          <div key={att.id} className="flex items-center justify-between py-2.5 px-1 text-sm group">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarCheck size={14} className="text-muted-foreground shrink-0" />
              <span>{new Date(att.attended_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
              })}</span>
              {att.memo && (
                <span className="text-xs text-muted-foreground truncate">— {att.memo}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground mr-1">
                {att.subscription?.type === 'count' ? '횟수제' : '기간제'}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => openEdit(att)}
              >
                <Pencil size={12} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(att)}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 출석 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>출석 이력 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>출석일</Label>
              <Input
                type="date"
                value={editDate}
                max={today}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>메모 (선택)</Label>
              <Input
                placeholder="메모 입력"
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>취소</Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateAtt.isPending}>
              {updateAtt.isPending ? '처리 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>출석 이력 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && new Date(deleteTarget.attended_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              })} 출석 기록을 삭제합니다.
              {deleteTarget?.subscription?.type === 'count' && ' 횟수제 수강권의 잔여 횟수가 1회 복원됩니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
