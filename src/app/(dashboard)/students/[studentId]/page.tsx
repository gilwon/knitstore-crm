'use client'

import { useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, BookOpen, CalendarCheck, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AttendanceButton } from '@/features/students/components/AttendanceButton'
import { AttendanceHistory } from '@/features/students/components/AttendanceHistory'
import { SubscriptionForm } from '@/features/students/components/SubscriptionForm'
import { StudentForm } from '@/features/students/components/StudentForm'
import { useStudent } from '@/features/students/hooks/useStudents'
import { useShop } from '@/features/inventory/hooks/useShop'

interface PageProps {
  params: Promise<{ studentId: string }>
}

function subStatusLabel(status: string) {
  if (status === 'active') return '진행 중'
  if (status === 'expired') return '만료'
  if (status === 'exhausted') return '소진'
  return status
}

function subStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default'
  if (status === 'expired') return 'destructive'
  if (status === 'exhausted') return 'secondary'
  return 'outline'
}

export default function StudentDetailPage({ params }: PageProps) {
  const { studentId } = use(params)
  const { data: student, isLoading } = useStudent(studentId)
  const { data: shop } = useShop()

  const [subFormOpen, setSubFormOpen] = useState(false)
  const [editFormOpen, setEditFormOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">수강생을 찾을 수 없습니다.</p>
        <Link href="/students">
          <Button variant="outline" size="sm">목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const activeSub = student.subscriptions?.find((s) => s.status === 'active') ?? null
  const attendances = student.attendances ?? []
  const subscriptions = student.subscriptions ?? []

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold leading-tight">{student.name}</h1>
          {student.phone && (
            <p className="text-xs text-muted-foreground mt-0.5">{student.phone}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setEditFormOpen(true)}>
            수정
          </Button>
          <AttendanceButton
            studentId={student.id}
            studentName={student.name}
            activeSubscription={activeSub}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BookOpen size={14} />
                  <span className="text-xs">현재 수강권</span>
                </div>
                <p className="text-sm font-semibold">
                  {activeSub
                    ? activeSub.type === 'count'
                      ? `${activeSub.remaining ?? 0}회 남음`
                      : '기간제'
                    : '없음'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CalendarCheck size={14} />
                  <span className="text-xs">총 출석</span>
                </div>
                <p className="text-2xl font-bold">
                  {attendances.length}
                  <span className="text-sm font-normal text-muted-foreground ml-1">회</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BookOpen size={14} />
                  <span className="text-xs">수강권 수</span>
                </div>
                <p className="text-2xl font-bold">
                  {subscriptions.length}
                  <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 메모 */}
          {student.memo && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-1">메모</p>
                <p className="text-sm whitespace-pre-line">{student.memo}</p>
              </CardContent>
            </Card>
          )}

          {/* 탭 */}
          <Tabs defaultValue="subscriptions">
            <TabsList className="w-full">
              <TabsTrigger value="subscriptions" className="flex-1">수강권</TabsTrigger>
              <TabsTrigger value="attendance" className="flex-1">출석 이력</TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="mt-4 space-y-2">
              {subscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    등록된 수강권이 없습니다.
                  </CardContent>
                </Card>
              ) : (
                subscriptions
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((sub) => (
                    <Card key={sub.id}>
                      <CardContent className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {sub.type === 'count' ? '횟수제' : '기간제'}
                            </span>
                            <Badge variant={subStatusVariant(sub.status)} className="text-xs">
                              {subStatusLabel(sub.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sub.type === 'count'
                              ? `${sub.remaining ?? 0} / ${sub.total_count ?? 0}회`
                              : `${new Date(sub.starts_at).toLocaleDateString('ko-KR')} ~ ${sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('ko-KR') : '무기한'}`
                            }
                          </p>
                        </div>
                        <span className="text-sm font-medium shrink-0">
                          {sub.price.toLocaleString()}원
                        </span>
                      </CardContent>
                    </Card>
                  ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-muted-foreground"
                onClick={() => setSubFormOpen(true)}
              >
                <Plus size={14} />
                수강권 추가
              </Button>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardContent className="p-0 px-4">
                  <AttendanceHistory attendances={attendances} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sheets */}
      <SubscriptionForm
        open={subFormOpen}
        onOpenChange={setSubFormOpen}
        studentId={student.id}
        studentName={student.name}
      />

      {shop && (
        <StudentForm
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          shopId={shop.id}
          editStudent={student}
        />
      )}
    </div>
  )
}
