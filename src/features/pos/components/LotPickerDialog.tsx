'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductWithLots } from '@/features/inventory/types'
import type { CartItem } from '../types'

interface LotPickerDialogProps {
  product: ProductWithLots | null
  onAdd: (item: CartItem) => void
  onClose: () => void
}

export function LotPickerDialog({ product, onAdd, onClose }: LotPickerDialogProps) {
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const availableLots = product.lots.filter((l) => l.stock_quantity > 0)
  const selectedLot = availableLots.find((l) => l.id === selectedLotId)

  function handleAdd() {
    if (!selectedLot) return
    onAdd({
      productId: product!.id,
      productName: product!.name,
      brand: product!.brand,
      colorName: [product!.color_code, product!.color_name].filter(Boolean).join(' '),
      unit: product!.unit,
      lotId: selectedLot.id,
      lotNumber: selectedLot.lot_number,
      unitPrice: product!.price,
      quantity,
      maxStock: selectedLot.stock_quantity,
    })
    setSelectedLotId('')
    setQuantity(1)
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {product.brand} {product.name}
            {product.color_name && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                · {product.color_code} {product.color_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 로트 선택 */}
          <div className="space-y-2">
            <Label>로트 선택</Label>
            {availableLots.length === 0 ? (
              <p className="text-sm text-destructive">재고가 없습니다</p>
            ) : (
              <div className="space-y-1">
                {availableLots.map((lot) => (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                      selectedLotId === lot.id
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="font-mono">{lot.lot_number}</span>
                    <span className="ml-2 text-muted-foreground">
                      재고 {lot.stock_quantity}{product.unit === 'ball' ? '볼' : 'g'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 수량 */}
          {selectedLot && (
            <div className="space-y-1">
              <Label>수량 ({product.unit === 'ball' ? '볼' : 'g'})</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={selectedLot.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(selectedLot.stock_quantity, Math.max(1, Number(e.target.value))))}
                  className="h-8 w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setQuantity((q) => Math.min(selectedLot.stock_quantity, q + 1))}
                >
                  +
                </Button>
                <span className="text-xs text-muted-foreground">최대 {selectedLot.stock_quantity}</span>
              </div>
              <p className="text-sm font-medium">
                {(product.price * quantity).toLocaleString()}원
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleAdd} disabled={!selectedLot || quantity < 1}>
            장바구니 담기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
