'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { LotBadge } from './LotBadge'
import { StockInSheet } from './StockInSheet'
import { StockOutSheet } from './StockOutSheet'
import { useDeleteProduct } from '../hooks/useProducts'
import type { ProductWithLots } from '../types'
import type { Lot } from '@/types/database'

interface ProductCardProps {
  product: ProductWithLots
  onEdit: () => void
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const deleteProduct = useDeleteProduct()
  const [stockInLot, setStockInLot] = useState<Lot | null>(null)
  const [stockOutLot, setStockOutLot] = useState<Lot | null>(null)
  const [showStockInAll, setShowStockInAll] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const totalStock = product.lots.reduce((sum, l) => sum + l.stock_quantity, 0)
  const unitLabel = product.unit === 'ball' ? '볼' : 'g'

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.brand && (
                  <span className="text-xs text-muted-foreground font-medium">{product.brand}</span>
                )}
                <span className="font-semibold text-sm truncate">{product.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[product.color_code, product.color_name].filter(Boolean).join(' ')}
                {product.price > 0 && ` · ₩${product.price.toLocaleString()}`}
              </p>
              <p className="text-xs font-medium mt-1">
                총 {totalStock}
                <span className="text-muted-foreground font-normal">{unitLabel}</span>
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Link href={`/inventory/${product.id}`}>
                <Button variant="ghost" size="icon-sm" title="상세 보기">
                  <ExternalLink size={14} />
                </Button>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={onEdit} title="상품 수정">
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                title="상품 삭제"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-3 flex-1 flex flex-col">
          {/* 로트 목록 */}
          <div className="space-y-1.5 flex-1">
            {product.lots.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                등록된 로트가 없습니다
              </p>
            ) : (
              product.lots.map((lot) => (
                <div key={lot.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground truncate">{lot.lot_number}</span>
                    <LotBadge lot={lot} unit={product.unit} alertThreshold={product.alert_threshold} />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 text-xs"
                      onClick={() => setStockInLot(lot)}
                    >
                      <ArrowDownToLine size={11} />
                      입고
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 text-xs"
                      onClick={() => setStockOutLot(lot)}
                      disabled={lot.stock_quantity === 0}
                    >
                      <ArrowUpFromLine size={11} />
                      출고
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 새 로트 입고 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 text-xs text-muted-foreground border-dashed"
            onClick={() => setShowStockInAll(true)}
          >
            + 새 로트 입고
          </Button>
        </CardContent>
      </Card>

      {stockInLot && (
        <StockInSheet
          open
          onOpenChange={(open) => !open && setStockInLot(null)}
          product={product}
          lots={product.lots}
          defaultLotId={stockInLot.id}
        />
      )}
      {showStockInAll && (
        <StockInSheet
          open
          onOpenChange={(open) => !open && setShowStockInAll(false)}
          product={product}
          lots={product.lots}
        />
      )}
      {stockOutLot && (
        <StockOutSheet
          open
          onOpenChange={(open) => !open && setStockOutLot(null)}
          product={product}
          lots={product.lots}
          defaultLotId={stockOutLot.id}
        />
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>상품 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{product.name}</strong>을(를) 삭제하면 모든 로트와
            입출고 이력이 함께 삭제됩니다. 계속하시겠습니까?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>취소</Button>
            <Button
              variant="destructive"
              disabled={deleteProduct.isPending}
              onClick={async () => {
                await deleteProduct.mutateAsync(product.id)
                setConfirmDelete(false)
              }}
            >
              {deleteProduct.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
