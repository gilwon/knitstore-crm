'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { CustomerRankItem } from '../hooks/useCustomerStats'

interface Props {
  items: CustomerRankItem[]
}

export function CustomerRanking({ items }: Props) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Users size={13} /> 고객별 구매 패턴 (상위 10명)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">수강생</TableHead>
              <TableHead className="px-4 text-right">총 구매액</TableHead>
              <TableHead className="px-4 text-right">구매 횟수</TableHead>
              <TableHead className="px-4 text-right">최근 구매</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 10).map((item) => (
              <TableRow key={item.studentId}>
                <TableCell className="px-4 text-sm">
                  <Link href={`/students/${item.studentId}`} className="hover:underline">
                    {item.studentName}
                  </Link>
                </TableCell>
                <TableCell className="px-4 text-sm text-right font-medium tabular-nums">
                  {item.totalSpent.toLocaleString()}원
                </TableCell>
                <TableCell className="px-4 text-sm text-right">{item.purchaseCount}회</TableCell>
                <TableCell className="px-4 text-xs text-right text-muted-foreground">
                  {new Date(item.lastPurchase).toLocaleDateString('ko-KR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
