'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getMarginGrade, marginGradeLabels, marginGradeBadgeVariants } from '../utils/margin'
import type { ProductRankItem } from '../types'

interface Props {
  items: ProductRankItem[]
}

interface BrandMargin {
  brand: string
  totalRevenue: number
  totalCost: number
  margin: number
  marginRate: number
}

export function BrandMarginTable({ items }: Props) {
  if (items.length === 0) return null

  // 브랜드별 집계
  const brandMap = new Map<string, BrandMargin>()
  for (const item of items) {
    const brand = item.brand || '기타'
    const existing = brandMap.get(brand)
    if (existing) {
      existing.totalRevenue += item.total_revenue
      existing.totalCost += item.total_cost
      existing.margin = existing.totalRevenue - existing.totalCost
      existing.marginRate = existing.totalRevenue > 0
        ? (existing.margin / existing.totalRevenue) * 100
        : 0
    } else {
      brandMap.set(brand, {
        brand,
        totalRevenue: item.total_revenue,
        totalCost: item.total_cost,
        margin: item.total_revenue - item.total_cost,
        marginRate: item.total_revenue > 0
          ? ((item.total_revenue - item.total_cost) / item.total_revenue) * 100
          : 0,
      })
    }
  }

  const brands = Array.from(brandMap.values()).sort((a, b) => b.margin - a.margin)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">브랜드별 마진 분석</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">브랜드</TableHead>
              <TableHead className="px-4 text-right">매출</TableHead>
              <TableHead className="px-4 text-right">마진</TableHead>
              <TableHead className="px-4 text-right">마진율</TableHead>
              <TableHead className="px-4">등급</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((b) => {
              const grade = getMarginGrade(b.marginRate)
              return (
                <TableRow key={b.brand}>
                  <TableCell className="px-4 text-sm font-medium">{b.brand}</TableCell>
                  <TableCell className="px-4 text-sm text-right tabular-nums">
                    {b.totalRevenue.toLocaleString()}원
                  </TableCell>
                  <TableCell className="px-4 text-sm text-right tabular-nums">
                    {b.margin.toLocaleString()}원
                  </TableCell>
                  <TableCell className="px-4 text-sm text-right tabular-nums">
                    {b.marginRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge variant={marginGradeBadgeVariants[grade]} className="text-xs">
                      {marginGradeLabels[grade]}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
