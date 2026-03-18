'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOnboardingStatus, useCompleteOnboarding } from '../hooks/useOnboarding'
import { useShop } from '@/features/inventory/hooks/useShop'

const steps = [
  { key: 'shopProfileCompleted', label: '공방 정보 확인', href: '/settings', description: '공방명을 설정하세요' },
  { key: 'firstProductAdded', label: '첫 상품 등록', href: '/inventory', description: '실/부자재를 등록하세요' },
  { key: 'firstStudentAdded', label: '첫 수강생 등록', href: '/students', description: '수강생을 등록하세요' },
  { key: 'firstSaleCompleted', label: 'POS 체험 판매', href: '/pos', description: '첫 판매를 해보세요' },
] as const

export function OnboardingChecklist() {
  const { data: status, isLoading } = useOnboardingStatus()
  const { data: shop } = useShop()
  const completeOnboarding = useCompleteOnboarding()

  if (isLoading || !status || status.allCompleted) return null

  const progress = (status.completedCount / status.totalCount) * 100

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          시작 가이드
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {status.completedCount}/{status.totalCount} 완료
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {/* 진행률 바 */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 체크리스트 */}
        <div className="space-y-2">
          {steps.map((step) => {
            const completed = status[step.key as keyof typeof status] as boolean
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  completed ? 'opacity-60' : 'hover:bg-primary/10'
                }`}
              >
                {completed ? (
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                ) : (
                  <Circle size={16} className="text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className={`text-sm ${completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                    {step.label}
                  </p>
                  {!completed && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* 모두 완료 시 숨기기 버튼 */}
        {status.completedCount === status.totalCount && shop && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => completeOnboarding.mutate(shop.id)}
          >
            시작 가이드 닫기
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
