'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCreateOnlineSale } from '../hooks/useOnlineSales'
import { downloadImportTemplate } from '../utils/exportExcel'
import type { OnlineSaleInsert } from '../types'

type Step = 'upload' | 'preview' | 'importing' | 'done'

interface ParsedRow {
  data: Omit<OnlineSaleInsert, 'shop_id'>
  errors: string[]
}

interface Props {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const HEADER_MAP: Record<string, keyof Omit<OnlineSaleInsert, 'shop_id' | 'id' | 'created_at'>> = {
  '판매일': 'sale_date',
  '상품주문번호': 'order_number',
  '상품명': 'product_name',
  '판매금액': 'sale_amount',
  '택배비(수입)': 'shipping_income',
  '주문관리수수료': 'order_fee',
  '매출연동수수료': 'sales_fee',
  '부가세': 'vat',
  '실원가': 'product_cost',
  '부자재원가': 'material_cost',
  '포장비': 'packaging_cost',
  '택배비(비용)': 'shipping_cost',
  '비고': 'memo',
}

export function ExcelImportDialog({ shopId, open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState({ success: 0, failed: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const createMutation = useCreateOnlineSale()

  const validRows = parsedRows.filter((r) => r.errors.length === 0)
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      if (rows.length < 2) return

      const headers = rows[0] as string[]
      const colMap = new Map<number, string>()
      headers.forEach((h, i) => {
        const key = HEADER_MAP[h.trim()]
        if (key) colMap.set(i, key)
      })

      const parsed: ParsedRow[] = []
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.every((c) => c === '' || c === null || c === undefined)) continue

        const errors: string[] = []
        const record: Record<string, unknown> = {}

        colMap.forEach((key, idx) => {
          const val = row[idx]
          if (key === 'sale_date') {
            if (val instanceof Date) {
              const d = val
              record[key] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            } else {
              record[key] = String(val ?? '').replace(/[./]/g, '-')
            }
          } else if (key === 'order_number' || key === 'product_name' || key === 'memo') {
            record[key] = String(val ?? '')
          } else {
            record[key] = Number(val) || 0
          }
        })

        if (!record.product_name) errors.push('상품명 필수')
        if (!record.sale_date) errors.push('판매일 필수')

        parsed.push({ data: record as Omit<OnlineSaleInsert, 'shop_id'>, errors })
      }

      setParsedRows(parsed)
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    setStep('importing')
    let success = 0
    let failed = 0

    for (let i = 0; i < validRows.length; i++) {
      try {
        await createMutation.mutateAsync({ shop_id: shopId, ...validRows[i].data })
        success++
      } catch {
        failed++
      }
      setProgress(i + 1)
    }

    setResult({ success, failed })
    setStep('done')
  }

  const handleClose = () => {
    setStep('upload')
    setParsedRows([])
    setProgress(0)
    setResult({ success: 0, failed: 0 })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>엑셀 업로드</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">엑셀 파일을 선택하거나 드래그하세요</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <Button variant="outline" size="sm" onClick={downloadImportTemplate}>
              <FileSpreadsheet size={14} className="mr-1" /> 입력 템플릿 다운로드
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="default">{validRows.length}건 정상</Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive">{invalidRows.length}건 오류</Badge>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto text-sm space-y-1">
              {validRows.slice(0, 5).map((r, i) => (
                <div key={i} className="flex justify-between py-1 border-b">
                  <span>{r.data.sale_date} - {r.data.product_name}</span>
                  <span>{(r.data.sale_amount as number || 0).toLocaleString()}원</span>
                </div>
              ))}
              {validRows.length > 5 && (
                <p className="text-xs text-muted-foreground">...외 {validRows.length - 5}건</p>
              )}
              {invalidRows.map((r, i) => (
                <div key={`err-${i}`} className="py-1 border-b text-destructive">
                  행 {i + 1}: {r.errors.join(', ')}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                {validRows.length}건 가져오기
              </Button>
              <Button variant="outline" onClick={() => { setStep('upload'); setParsedRows([]) }}>
                다시 선택
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">가져오는 중...</p>
            <p className="text-lg font-bold">{progress} / {validRows.length}</p>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${(progress / validRows.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle size={40} className="mx-auto text-primary" />
            <p className="font-medium">가져오기 완료</p>
            <div className="flex justify-center gap-3">
              <Badge variant="default">{result.success}건 성공</Badge>
              {result.failed > 0 && <Badge variant="destructive">{result.failed}건 실패</Badge>}
            </div>
            <Button onClick={handleClose} className="mt-2">닫기</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
