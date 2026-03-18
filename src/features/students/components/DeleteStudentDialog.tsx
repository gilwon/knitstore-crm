'use client'

import { useRouter } from 'next/navigation'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteStudent } from '../hooks/useStudents'
import type { StudentWithDetails } from '../types'

interface DeleteStudentDialogProps {
  student: StudentWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteStudentDialog({ student, open, onOpenChange }: DeleteStudentDialogProps) {
  const router = useRouter()
  const deleteStudent = useDeleteStudent()

  const subsCount = student.subscriptions?.length ?? 0
  const attCount = student.attendances?.length ?? 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>수강생 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{student.name}</strong> 수강생을 삭제하면
            수강권 {subsCount}개, 출석 이력 {attCount}건도 함께 삭제됩니다.
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={async () => {
              await deleteStudent.mutateAsync(student.id)
              onOpenChange(false)
              router.push('/students')
            }}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
