'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SaleItem {
  id: string
  quantity: number
  subtotal: number
  lot_id: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
  saleAmount: number
  items: SaleItem[]
}

export function RefundDialog({ open, onOpenChange, saleId, saleAmount, items }: Props) {
  const qc = useQueryClient()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState('')

  const refundAmount = items
    .filter((i) => selectedItems.has(i.id))
    .reduce((sum, i) => sum + i.subtotal, 0)

  const refundMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient()

      // 환불할 항목들의 재고 복원
      for (const item of items.filter((i) => selectedItems.has(i.id))) {
        if (item.lot_id) {
          await supabase.rpc('process_stock_in', {
            p_lot_id: item.lot_id,
            p_quantity: item.quantity,
            p_reason: 'return',
            p_memo: `환불 처리 (판매 ${saleId.slice(0, 8)})`,
          })
        }
      }

      // refunds 테이블 insert (테이블 존재 시)
      // 현재는 stock_movements에 return 사유로 기록됨
    },
    onSuccess: () => {
      toast.success(`${refundAmount.toLocaleString()}원 환불이 처리되었습니다`)
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      onOpenChange(false)
      setSelectedItems(new Set())
      setReason('')
    },
    onError: () => toast.error('환불 처리에 실패했습니다'),
  })

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw size={16} />
            환불 처리
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            환불할 항목을 선택하세요. 선택한 항목의 재고가 자동으로 복원됩니다.
          </p>

          <div className="space-y-2 border rounded-md p-3">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded p-1 -mx-1"
              >
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span className="text-sm flex-1">수량 {item.quantity}개</span>
                <span className="text-sm font-medium">{item.subtotal.toLocaleString()}원</span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">환불 사유</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="선택사항"
              className="h-8 text-sm"
            />
          </div>

          {refundAmount > 0 && (
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>환불 금액</span>
              <span className="text-destructive">{refundAmount.toLocaleString()}원</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button
            variant="destructive"
            disabled={selectedItems.size === 0 || refundMutation.isPending}
            onClick={() => refundMutation.mutateAsync()}
          >
            {refundMutation.isPending ? '처리 중...' : `${refundAmount.toLocaleString()}원 환불`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
