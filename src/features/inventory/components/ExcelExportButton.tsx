'use client'

import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProductWithLots } from '../types'

interface ExcelExportButtonProps {
  products: ProductWithLots[]
}

export function ExcelExportButton({ products }: ExcelExportButtonProps) {
  function handleExport() {
    const rows: Record<string, unknown>[] = []

    for (const product of products) {
      if (product.lots.length === 0) {
        rows.push({
          '상품명': product.name,
          '브랜드': product.brand,
          '색상번호': product.color_code,
          '색상명': product.color_name,
          '단위': product.unit,
          '로트번호': '-',
          '재고수량': 0,
          '판매단가': product.price,
          '구매단가': product.purchase_price,
        })
      } else {
        for (const lot of product.lots) {
          rows.push({
            '상품명': product.name,
            '브랜드': product.brand,
            '색상번호': product.color_code,
            '색상명': product.color_name,
            '단위': product.unit,
            '로트번호': lot.lot_number,
            '재고수량': lot.stock_quantity,
            '판매단가': product.price,
            '구매단가': product.purchase_price,
          })
        }
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
      { wch: 6 }, { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '재고현황')

    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `재고현황_${today}.xlsx`)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={products.length === 0}
    >
      <Download size={14} />
      익스포트
    </Button>
  )
}
