'use client'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useProductMovements } from '../hooks/useLots'

interface MovementHistoryProps {
  productId: string
  unit: 'ball' | 'g'
}

const REASON_LABELS: Record<string, string> = {
  purchase: '구매입고',
  return: '반품입고',
  adjustment: '재고조정',
  sale: '판매출고',
  disposal: '폐기',
}

export function MovementHistory({ productId, unit }: MovementHistoryProps) {
  const { data: movements, isLoading } = useProductMovements(productId)

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
  }

  if (!movements || movements.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">입출고 이력이 없습니다.</p>
  }

  const unitLabel = unit === 'ball' ? '볼' : 'g'

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>일시</TableHead>
          <TableHead>로트</TableHead>
          <TableHead>구분</TableHead>
          <TableHead>사유</TableHead>
          <TableHead className="text-right">수량</TableHead>
          <TableHead>메모</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(m.created_at).toLocaleDateString('ko-KR', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </TableCell>
            <TableCell className="text-xs">{m.lot_number}</TableCell>
            <TableCell>
              <Badge variant={m.type === 'in' ? 'default' : 'destructive'} className="text-xs">
                {m.type === 'in' ? '입고' : '출고'}
              </Badge>
            </TableCell>
            <TableCell className="text-xs">{REASON_LABELS[m.reason] ?? m.reason}</TableCell>
            <TableCell className="text-right text-xs font-medium">
              {m.type === 'in' ? '+' : '-'}{m.quantity}{unitLabel}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{m.memo ?? '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
