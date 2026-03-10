'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

// ─── 타입 ───────────────────────────────────────────────────────────
interface ParsedRow {
  rowIndex: number
  name: string
  brand: string
  color_code: string
  color_name: string
  unit: string
  purchase_price: number
  price: number
  alert_threshold: number
  lot_number: string
  quantity: number
  errors: string[]
}

interface ImportResult {
  total: number
  success: number
  failed: number
  details: { row: number; name: string; ok: boolean; message: string }[]
}

// ─── 엑셀 템플릿 다운로드 ────────────────────────────────────────────
function downloadTemplate() {
  const headers = ['상품명*', '브랜드', '색상번호*', '색상명*', '단위*(ball/g)', '구매단가*', '판매단가*', '부족알림수량', '로트번호', '초기수량']
  const example = ['코튼골드', '알리제', '#101', '레드', 'ball', '3500', '5000', '3', 'LOT-2026-A', '10']

  const ws = XLSX.utils.aoa_to_sheet([headers, example])

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '재고목록')
  XLSX.writeFile(wb, '재고_업로드_양식.xlsx')
}

// ─── 엑셀 파싱 및 유효성 검사 ────────────────────────────────────────
function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (rows.length < 2) {
          return resolve([])
        }

        const parsed: ParsedRow[] = []

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as unknown[]
          const name = String(row[0] ?? '').trim()
          if (!name) continue  // 빈 행 스킵

          const brand = String(row[1] ?? '').trim()
          const color_code = String(row[2] ?? '').trim()
          const color_name = String(row[3] ?? '').trim()
          const unit = String(row[4] ?? '').trim().toLowerCase()
          const purchase_price = Number(row[5]) || 0
          const price = Number(row[6]) || 0
          const alert_threshold = Number(row[7]) || 0
          const lot_number = String(row[8] ?? '').trim()
          const quantity = Number(row[9]) || 0
          const errors: string[] = []

          if (!name) errors.push('상품명 필수')
          if (!color_code) errors.push('색상번호 필수')
          if (!color_name) errors.push('색상명 필수')
          if (unit !== 'ball' && unit !== 'g') errors.push('단위는 ball 또는 g')
          if (purchase_price < 0) errors.push('구매단가 음수 불가')
          if (price < 0) errors.push('판매단가 음수 불가')
          if (quantity < 0) errors.push('수량 음수 불가')
          if (quantity > 0 && !lot_number) errors.push('수량 입력 시 로트번호 필수')

          parsed.push({
            rowIndex: i + 1,
            name,
            brand,
            color_code,
            color_name,
            unit,
            purchase_price,
            price,
            alert_threshold,
            lot_number,
            quantity,
            errors,
          })
        }

        resolve(parsed)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────
interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

export function ExcelImportDialog({ open, onOpenChange, shopId }: ExcelImportDialogProps) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const validRows = rows.filter((r) => r.errors.length === 0)
  const invalidRows = rows.filter((r) => r.errors.length > 0)

  function handleClose() {
    if (step === 'importing') return
    onOpenChange(false)
    // 닫힐 때 초기화
    setTimeout(() => {
      setStep('upload')
      setRows([])
      setProgress(0)
      setResult(null)
    }, 300)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const parsed = await parseExcelFile(file)
      if (parsed.length === 0) {
        toast.error('데이터가 없습니다. 1행은 헤더, 2행부터 데이터를 입력해주세요.')
        return
      }
      setRows(parsed)
      setStep('preview')
    } catch {
      toast.error('파일 파싱 실패. 올바른 xlsx 파일인지 확인해주세요.')
    }
    // 같은 파일 재선택 허용
    e.target.value = ''
  }

  async function handleImport() {
    if (validRows.length === 0) return
    setStep('importing')
    setProgress(0)

    const supabase = createClient()
    const details: ImportResult['details'] = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        // 1. 상품 생성
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            shop_id: shopId,
            name: row.name,
            brand: row.brand,
            color_code: row.color_code,
            color_name: row.color_name,
            unit: row.unit as 'ball' | 'g',
            purchase_price: row.purchase_price,
            price: row.price,
            alert_threshold: row.alert_threshold,
          })
          .select()
          .single()

        if (productError) throw productError

        // 2. 초기 입고 (로트번호 + 수량 있을 때)
        if (row.lot_number && row.quantity > 0) {
          const { data: lot, error: lotError } = await supabase
            .from('lots')
            .insert({ product_id: product.id, lot_number: row.lot_number })
            .select()
            .single()

          if (lotError) throw lotError

          const { error: stockError } = await supabase.rpc('process_stock_in', {
            p_lot_id: lot.id,
            p_quantity: row.quantity,
            p_reason: 'purchase',
            p_memo: null,
          })

          if (stockError) throw stockError
        }

        details.push({ row: row.rowIndex, name: row.name, ok: true, message: '등록 완료' })
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류'
        details.push({ row: row.rowIndex, name: row.name, ok: false, message })
      }

      setProgress(i + 1)
    }

    const success = details.filter((d) => d.ok).length
    setResult({ total: validRows.length, success, failed: validRows.length - success, details })
    setStep('done')
    qc.invalidateQueries({ queryKey: ['products'] })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            엑셀로 재고 업로드
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: 업로드 */}
        {step === 'upload' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              엑셀 파일(.xlsx)로 상품과 초기 재고를 한 번에 등록합니다.
              먼저 양식을 다운로드해 작성해주세요.
            </p>

            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download size={14} className="mr-1" />
              양식 다운로드 (.xlsx)
            </Button>

            <div
              className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) {
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  if (fileInputRef.current) {
                    fileInputRef.current.files = dt.files
                    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
                  }
                }
              }}
            >
              <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">클릭하거나 파일을 드래그해주세요</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx 파일만 지원</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* 양식 설명 */}
            <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">열 순서 (1행: 헤더, 2행부터 데이터)</p>
              <p>A: 상품명* · B: 브랜드 · C: 색상번호* · D: 색상명* · E: 단위*(ball/g)</p>
              <p>F: 구매단가* · G: 판매단가* · H: 부족알림수량 · I: 로트번호 · J: 초기수량</p>
              <p className="text-xs">* I, J 열은 비워두면 상품만 등록됩니다.</p>
            </div>
          </div>
        )}

        {/* Step 2: 미리보기 */}
        {step === 'preview' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 text-sm">
              <span>전체 <strong>{rows.length}</strong>행</span>
              <Badge variant="default">{validRows.length}개 유효</Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive">{invalidRows.length}개 오류</Badge>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 px-2">행</TableHead>
                    <TableHead className="px-2">상품명</TableHead>
                    <TableHead className="px-2">단위</TableHead>
                    <TableHead className="px-2">로트</TableHead>
                    <TableHead className="px-2">수량</TableHead>
                    <TableHead className="px-2">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.rowIndex} className={row.errors.length > 0 ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-xs text-muted-foreground px-2">{row.rowIndex}</TableCell>
                      <TableCell className="text-xs font-medium px-2">
                        <div>{row.name}</div>
                        {row.brand && <div className="text-muted-foreground">{row.brand}</div>}
                      </TableCell>
                      <TableCell className="text-xs px-2">{row.unit}</TableCell>
                      <TableCell className="text-xs px-2">{row.lot_number || '-'}</TableCell>
                      <TableCell className="text-xs px-2">{row.quantity > 0 ? row.quantity : '-'}</TableCell>
                      <TableCell className="px-2">
                        {row.errors.length === 0 ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <span className="text-xs text-destructive">{row.errors.join(', ')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {invalidRows.length > 0 && (
              <p className="text-xs text-muted-foreground">
                오류 행은 가져오기에서 제외됩니다. 수정 후 재업로드하거나 유효한 {validRows.length}개만 가져올 수 있습니다.
              </p>
            )}
          </div>
        )}

        {/* Step 3: 가져오는 중 */}
        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 size={32} className="mx-auto animate-spin text-primary" />
            <p className="text-sm">가져오는 중... ({progress} / {validRows.length})</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(progress / validRows.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 'done' && result && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={16} /> {result.success}개 성공
              </span>
              {result.failed > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle size={16} /> {result.failed}개 실패
                </span>
              )}
            </div>

            {result.failed > 0 && (
              <div className="overflow-auto max-h-60 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>행</TableHead>
                      <TableHead>상품명</TableHead>
                      <TableHead>결과</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.details.filter((d) => !d.ok).map((d) => (
                      <TableRow key={d.row}>
                        <TableCell className="text-xs">{d.row}</TableCell>
                        <TableCell className="text-xs">{d.name}</TableCell>
                        <TableCell className="text-xs text-destructive">{d.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* 푸터 버튼 */}
        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>취소</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>다시 선택</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                {validRows.length}개 가져오기
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={handleClose}>닫기</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
