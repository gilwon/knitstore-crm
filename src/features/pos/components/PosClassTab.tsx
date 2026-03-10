'use client'

import { useState } from 'react'
import { Search, User, BookOpen, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useStudents } from '@/features/students/hooks/useStudents'
import { useCreateSubscription } from '@/features/students/hooks/useSubscriptions'
import { SubscriptionForm } from '@/features/students/components/SubscriptionForm'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { StudentWithSub } from '@/features/students/types'
import type { Subscription } from '@/types/database'

interface ClassFeeCheckoutInput {
  shopId: string
  studentId: string
  subscriptionId: string
  price: number
}

function useClassFeeCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId, studentId, subscriptionId, price }: ClassFeeCheckoutInput) => {
      const supabase = createClient()

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          shop_id: shopId,
          type: 'class_fee',
          total_amount: price,
          student_id: studentId,
        })
        .select()
        .single()

      if (saleError) throw saleError

      const { error: itemError } = await supabase.from('sale_items').insert({
        sale_id: sale.id,
        subscription_id: subscriptionId,
        quantity: 1,
        unit_price: price,
        subtotal: price,
      })

      if (itemError) throw itemError

      return sale
    },
    onSuccess: () => {
      toast.success('수강료 결제가 완료되었습니다')
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : '결제 처리에 실패했습니다'
      toast.error(msg)
    },
  })
}

function subscriptionLabel(sub: Subscription): string {
  if (sub.type === 'count') {
    return `횟수제 — 잔여 ${sub.remaining ?? 0}회`
  }
  if (sub.expires_at) {
    const diff = Math.ceil(
      (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return `기간제 — ${diff >= 0 ? `D-${diff}` : '만료'} (${sub.expires_at.slice(0, 10)})`
  }
  return '기간제'
}

function subscriptionBadgeVariant(
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

interface PosClassTabProps {
  shopId: string
}

export function PosClassTab({ shopId }: PosClassTabProps) {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentWithSub | null>(null)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [newSubOpen, setNewSubOpen] = useState(false)

  const { data: students = [], isLoading } = useStudents()
  const checkout = useClassFeeCheckout()

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone ?? '').toLowerCase().includes(q)
    )
  })

  function handleSelectStudent(student: StudentWithSub) {
    setSelectedStudent(student)
    setSelectedSub(null)
  }

  function handleBack() {
    setSelectedStudent(null)
    setSelectedSub(null)
  }

  async function handleCheckout() {
    if (!selectedStudent || !selectedSub) return
    await checkout.mutateAsync({
      shopId,
      studentId: selectedStudent.id,
      subscriptionId: selectedSub.id,
      price: selectedSub.price,
    })
    setSelectedSub(null)
    setSelectedStudent(null)
    setSearch('')
  }

  // 선택된 수강생의 전체 수강권 목록 (activeSubscription 외에 전체)
  const studentSubscriptions: Subscription[] =
    selectedStudent && 'subscriptions' in selectedStudent
      ? (selectedStudent as StudentWithSub & { subscriptions: Subscription[] }).subscriptions ?? []
      : selectedStudent?.activeSubscription
        ? [selectedStudent.activeSubscription]
        : []

  return (
    <div className="flex flex-col h-full gap-3">
      {!selectedStudent ? (
        <>
          {/* 수강생 검색 */}
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="수강생 이름, 전화번호 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 수강생 목록 */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pl-0.5 pr-1 py-0.5">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {search ? '검색 결과가 없습니다' : '등록된 수강생이 없습니다'}
              </div>
            ) : (
              filtered.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelectStudent(student)}
                  className="w-full text-left"
                >
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardContent className="py-2.5 px-3 flex items-center gap-3">
                      <User size={14} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{student.name}</span>
                          {student.activeSubscription ? (
                            <Badge
                              variant={subscriptionBadgeVariant(student.activeSubscription)}
                              className="text-xs shrink-0"
                            >
                              {student.activeSubscription.type === 'count'
                                ? `잔여 ${student.activeSubscription.remaining ?? 0}회`
                                : 'D-' + Math.ceil(
                                    (new Date(student.activeSubscription.expires_at ?? '').getTime() - Date.now()) /
                                      (1000 * 60 * 60 * 24)
                                  )}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
                              수강권 없음
                            </Badge>
                          )}
                        </div>
                        {student.phone && (
                          <p className="text-xs text-muted-foreground mt-0.5">{student.phone}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* 선택된 수강생 헤더 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 목록으로
            </button>
            <Separator orientation="vertical" className="h-4" />
            <User size={13} className="text-muted-foreground" />
            <span className="font-medium text-sm">{selectedStudent.name}</span>
            {selectedStudent.phone && (
              <span className="text-xs text-muted-foreground">{selectedStudent.phone}</span>
            )}
          </div>

          <Separator />

          {/* 수강권 목록 */}
          <div className="flex-1 overflow-y-auto space-y-2 pl-0.5 pr-1 py-0.5">
            <div className="flex items-center justify-between mb-1 px-0.5">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <BookOpen size={11} />
                수강권 선택
              </p>
              <button
                type="button"
                onClick={() => setNewSubOpen(true)}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                <Plus size={11} />
                새 수강권 등록
              </button>
            </div>

            {studentSubscriptions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
                <p>등록된 수강권이 없습니다</p>
                <button
                  type="button"
                  onClick={() => setNewSubOpen(true)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  수강권 등록하기
                </button>
              </div>
            ) : (
              studentSubscriptions.map((sub) => {
                const isSelected = selectedSub?.id === sub.id
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSub(isSelected ? null : sub)}
                    className="w-full text-left"
                  >
                    <Card
                      className={`transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <CardContent className="py-2.5 px-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={subscriptionBadgeVariant(sub)}
                              className="text-xs shrink-0"
                            >
                              {sub.type === 'count' ? '횟수제' : '기간제'}
                            </Badge>
                            <span className="text-sm">{subscriptionLabel(sub)}</span>
                          </div>
                          <p className="text-sm font-semibold mt-0.5">
                            {sub.price.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-0.5">원</span>
                          </p>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="text-xs shrink-0">선택됨</Badge>
                        )}
                      </CardContent>
                    </Card>
                  </button>
                )
              })
            )}
          </div>

          {/* 결제 영역 */}
          {selectedSub && (
            <div className="pt-3 space-y-3 shrink-0">
              <Separator />
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">결제 금액</span>
                <span className="text-xl font-bold">{selectedSub.price.toLocaleString()}원</span>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={checkout.isPending}
              >
                {checkout.isPending ? '처리 중...' : `${selectedSub.price.toLocaleString()}원 결제`}
              </Button>
            </div>
          )}

          {/* 새 수강권 등록 Sheet */}
          <SubscriptionForm
            open={newSubOpen}
            onOpenChange={setNewSubOpen}
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
          />
        </>
      )}
    </div>
  )
}
