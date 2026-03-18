export type MarginGrade = 'high' | 'mid' | 'low' | 'negative'

export function getMarginGrade(marginRate: number): MarginGrade {
  if (marginRate >= 40) return 'high'
  if (marginRate >= 20) return 'mid'
  if (marginRate >= 0) return 'low'
  return 'negative'
}

export const marginGradeLabels: Record<MarginGrade, string> = {
  high: '고마진',
  mid: '중마진',
  low: '저마진',
  negative: '역마진',
}

export const marginGradeColors: Record<MarginGrade, string> = {
  high: 'text-emerald-600',
  mid: 'text-blue-600',
  low: 'text-amber-600',
  negative: 'text-destructive',
}

export const marginGradeBadgeVariants: Record<MarginGrade, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'default',
  mid: 'secondary',
  low: 'outline',
  negative: 'destructive',
}
