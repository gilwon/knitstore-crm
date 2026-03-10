'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Lot } from '@/types/database'

interface LotMixWarningProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  activeLots: Lot[]
  requestedQty: number
  unit: 'ball' | 'g'
}

export function LotMixWarning({
  open,
  onConfirm,
  onCancel,
  activeLots,
  requestedQty,
  unit,
}: LotMixWarningProps) {
  const unitLabel = unit === 'ball' ? '볼' : 'g'
  const totalStock = activeLots.reduce((sum, l) => sum + l.stock_quantity, 0)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로트 혼합 경고</DialogTitle>
          <DialogDescription>
            단일 로트 재고({Math.max(...activeLots.map((l) => l.stock_quantity))}{unitLabel})가
            요청 수량({requestedQty}{unitLabel})보다 적습니다.
            여러 로트에서 출고가 발생할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border p-3 text-sm space-y-1">
          {activeLots.map((lot) => (
            <div key={lot.id} className="flex justify-between text-muted-foreground">
              <span>{lot.lot_number}</span>
              <span>재고: {lot.stock_quantity}{unitLabel}</span>
            </div>
          ))}
          <div className="flex justify-between font-medium pt-1 border-t">
            <span>총 가용 재고</span>
            <span>{totalStock}{unitLabel}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>취소</Button>
          <Button variant="destructive" onClick={onConfirm}>계속 진행</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
