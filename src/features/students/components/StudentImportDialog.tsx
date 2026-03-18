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

interface ParsedRow {
  rowIndex: number
  name: string
  phone: string
  memo: string
  errors: string[]
}

interface ImportResult {
  total: number
  success: number
  failed: number
  details: { row: number; name: string; ok: boolean; message: string }[]
}

function downloadTemplate() {
  const headers = ['이름*', '연락처', '메모']
  const example = ['김수진', '010-1234-5678', '초급반, 대바늘 수업']

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 24 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '수강생목록')
  XLSX.writeFile(wb, '수강생_업로드_양식.xlsx')
}

function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (rows.length < 2) return resolve([])

        const parsed: ParsedRow[] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as unknown[]
          const name = String(row[0] ?? '').trim()
          if (!name && !String(row[1] ?? '').trim()) continue

          const phone = String(row[1] ?? '').trim()
          const memo = String(row[2] ?? '').trim()
          const errors: string[] = []

          if (!name) errors.push('이름 필수')

          parsed.push({ rowIndex: i + 1, name, phone, memo, errors })
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

interface StudentImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

export function StudentImportDialog({ open, onOpenChange, shopId }: StudentImportDialogProps) {
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
    e.target.value = ''
  }

  async function handleImport() {
    if (validRows.length === 0) return
    setStep('importing')
    setProgress(0)

    const supabase = createClient()
    const details: ImportResult['details'] = []

    // bulk insert
    const insertData = validRows.map((r) => ({
      shop_id: shopId,
      name: r.name,
      phone: r.phone || null,
      memo: r.memo || null,
    }))

    const { data, error } = await supabase.from('students').insert(insertData).select()

    if (error) {
      // fallback: 개별 insert
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i]
        try {
          const { error: rowErr } = await supabase.from('students').insert({
            shop_id: shopId,
            name: row.name,
            phone: row.phone || null,
            memo: row.memo || null,
          })
          if (rowErr) throw rowErr
          details.push({ row: row.rowIndex, name: row.name, ok: true, message: '등록 완료' })
        } catch (err) {
          const msg = err instanceof Error ? err.message : '알 수 없는 오류'
          details.push({ row: row.rowIndex, name: row.name, ok: false, message: msg })
        }
        setProgress(i + 1)
      }
    } else {
      // bulk 성공
      validRows.forEach((row) => {
        details.push({ row: row.rowIndex, name: row.name, ok: true, message: '등록 완료' })
      })
      setProgress(validRows.length)
    }

    const success = details.filter((d) => d.ok).length
    setResult({ total: validRows.length, success, failed: validRows.length - success, details })
    setStep('done')
    qc.invalidateQueries({ queryKey: ['students'] })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            수강생 일괄 등록
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              엑셀 파일(.xlsx)로 수강생을 한 번에 등록합니다.
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
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">열 순서 (1행: 헤더, 2행부터 데이터)</p>
              <p>A: 이름* · B: 연락처 · C: 메모</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 text-sm">
              <span>전체 <strong>{rows.length}</strong>행</span>
              <Badge variant="default">{validRows.length}명 유효</Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive">{invalidRows.length}개 오류</Badge>
              )}
            </div>
            <div className="rounded-md border max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 px-2">행</TableHead>
                    <TableHead className="px-2">이름</TableHead>
                    <TableHead className="px-2">연락처</TableHead>
                    <TableHead className="px-2">메모</TableHead>
                    <TableHead className="w-8 px-2">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.rowIndex} className={row.errors.length > 0 ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-xs text-muted-foreground px-2">{row.rowIndex}</TableCell>
                      <TableCell className="text-xs font-medium px-2">{row.name || '-'}</TableCell>
                      <TableCell className="text-xs px-2">{row.phone || '-'}</TableCell>
                      <TableCell className="text-xs px-2 max-w-[120px] truncate">{row.memo || '-'}</TableCell>
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
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 size={32} className="mx-auto animate-spin text-primary" />
            <p className="text-sm">등록 중... ({progress} / {validRows.length})</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(progress / validRows.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={16} /> {result.success}명 등록 완료
              </span>
              {result.failed > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle size={16} /> {result.failed}명 실패
                </span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>취소</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>다시 선택</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                {validRows.length}명 등록하기
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
