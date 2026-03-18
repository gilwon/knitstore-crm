'use client'

import { useState } from 'react'
import { ClipboardCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useStockIn, useStockOut } from '../hooks/useLots'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ProductWithLots } from '../types'

interface StocktakeRow {
  lotId: string
  lotNumber: string
  productName: string
  systemQty: number
  physicalQty: string
  diff: number
}

interface AdjustResult {
  lotNumber: string
  productName: string
  ok: boolean
  message: string
}

type Step = 'confirm' | 'input' | 'adjusting' | 'done'

interface StocktakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: ProductWithLots[]
}

export function StocktakeDialog({ open, onOpenChange, products }: StocktakeDialogProps) {
  const qc = useQueryClient()
  const stockIn = useStockIn()
  const stockOut = useStockOut()
  const [step, setStep] = useState<Step>('confirm')
  const [rows, setRows] = useState<StocktakeRow[]>([])
  const [results, setResults] = useState<AdjustResult[]>([])

  function initRows() {
    const r: StocktakeRow[] = []
    for (const product of products) {
      for (const lot of product.lots) {
        r.push({
          lotId: lot.id,
          lotNumber: lot.lot_number,
          productName: product.name,
          systemQty: lot.stock_quantity,
          physicalQty: String(lot.stock_quantity),
          diff: 0,
        })
      }
    }
    setRows(r)
  }

  function handleOpen() {
    initRows()
    setStep('confirm')
    setResults([])
  }

  function handleClose() {
    if (step === 'adjusting') return
    onOpenChange(false)
  }

  function updatePhysicalQty(index: number, value: string) {
    setRows((prev) => {
      const next = [...prev]
      const num = parseInt(value, 10)
      next[index] = {
        ...next[index],
        physicalQty: value,
        diff: isNaN(num) ? 0 : num - next[index].systemQty,
      }
      return next
    })
  }

  const adjustmentRows = rows.filter((r) => {
    const num = parseInt(r.physicalQty, 10)
    return !isNaN(num) && num !== r.systemQty
  })

  async function handleAdjust() {
    if (adjustmentRows.length === 0) {
      toast.success('조정할 항목이 없습니다')
      return
    }
    setStep('adjusting')
    const res: AdjustResult[] = []

    for (const row of adjustmentRows) {
      const physical = parseInt(row.physicalQty, 10)
      const diff = physical - row.systemQty
      try {
        if (diff > 0) {
          await stockIn.mutateAsync({
            lot_id: row.lotId,
            quantity: diff,
            reason: 'adjustment',
            memo: '재고 실사 조정',
          })
        } else {
          await stockOut.mutateAsync({
            lot_id: row.lotId,
            quantity: Math.abs(diff),
            reason: 'adjustment',
            memo: '재고 실사 조정',
          })
        }
        res.push({
          lotNumber: row.lotNumber,
          productName: row.productName,
          ok: true,
          message: `${row.systemQty} → ${physical} (${diff > 0 ? '+' : ''}${diff})`,
        })
      } catch (err) {
        res.push({
          lotNumber: row.lotNumber,
          productName: row.productName,
          ok: false,
          message: err instanceof Error ? err.message : '조정 실패',
        })
      }
    }

    setResults(res)
    setStep('done')
    qc.invalidateQueries({ queryKey: ['products'] })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) handleOpen(); handleClose() }}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck size={18} />
            재고 실사
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: 확인 */}
        {step === 'confirm' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              전체 상품의 로트별 재고를 확인합니다. 물리 수량을 입력한 후 차이를 조정할 수 있습니다.
            </p>
            <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                실사 중 다른 입출고 처리는 정확도에 영향을 줄 수 있습니다.
              </p>
            </div>
            <p className="text-sm">
              대상: <strong>{products.length}</strong>개 상품, <strong>{rows.length}</strong>개 로트
            </p>
          </div>
        )}

        {/* Step 2: 수량 입력 */}
        {step === 'input' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {rows.length}개 로트 — 물리 수량을 입력하세요
            </p>
            <div className="rounded-md border max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3">상품명</TableHead>
                    <TableHead className="px-3">로트</TableHead>
                    <TableHead className="px-3 text-right w-20">시스템</TableHead>
                    <TableHead className="px-3 w-24">물리</TableHead>
                    <TableHead className="px-3 text-right w-16">차이</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={row.lotId} className={row.diff !== 0 ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}>
                      <TableCell className="px-3 text-xs">{row.productName}</TableCell>
                      <TableCell className="px-3 text-xs font-mono">{row.lotNumber}</TableCell>
                      <TableCell className="px-3 text-xs text-right">{row.systemQty}</TableCell>
                      <TableCell className="px-3">
                        <Input
                          type="number"
                          min={0}
                          className="h-7 w-20 text-xs"
                          value={row.physicalQty}
                          onChange={(e) => updatePhysicalQty(i, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={`px-3 text-xs text-right font-medium ${row.diff > 0 ? 'text-emerald-600' : row.diff < 0 ? 'text-destructive' : ''}`}>
                        {row.diff !== 0 ? `${row.diff > 0 ? '+' : ''}${row.diff}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {adjustmentRows.length > 0 && (
              <p className="text-xs text-muted-foreground">
                차이 있는 로트: <strong>{adjustmentRows.length}</strong>개
              </p>
            )}
          </div>
        )}

        {/* Step 3: 조정 중 */}
        {step === 'adjusting' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 size={32} className="mx-auto animate-spin text-primary" />
            <p className="text-sm">재고 조정 중...</p>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 'done' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={16} /> {results.filter((r) => r.ok).length}개 조정 완료
              </span>
              {results.some((r) => !r.ok) && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle size={16} /> {results.filter((r) => !r.ok).length}개 실패
                </span>
              )}
            </div>
            <div className="rounded-md border max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3">상품명</TableHead>
                    <TableHead className="px-3">로트</TableHead>
                    <TableHead className="px-3">결과</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.lotNumber}>
                      <TableCell className="px-3 text-xs">{r.productName}</TableCell>
                      <TableCell className="px-3 text-xs font-mono">{r.lotNumber}</TableCell>
                      <TableCell className={`px-3 text-xs ${r.ok ? 'text-emerald-600' : 'text-destructive'}`}>
                        {r.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={handleClose}>취소</Button>
              <Button onClick={() => setStep('input')} disabled={rows.length === 0}>
                실사 시작 ({rows.length}개 로트)
              </Button>
            </>
          )}
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={() => setStep('confirm')}>이전</Button>
              <Button onClick={handleAdjust}>
                {adjustmentRows.length > 0
                  ? `${adjustmentRows.length}개 차이 조정`
                  : '조정할 항목 없음'}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => onOpenChange(false)}>닫기</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
