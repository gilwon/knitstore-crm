import * as XLSX from 'xlsx'
import type { OnlineSale } from '../types'
import { calcOnlineSale } from './calc'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export function exportOnlineSales(sales: OnlineSale[], dateLabel: string) {
  const rows = sales.map((s) => {
    const c = calcOnlineSale(s)
    return {
      판매일: s.sale_date,
      상품주문번호: s.order_number,
      상품명: s.product_name,
      판매금액: s.sale_amount,
      '택배비(수입)': s.shipping_income,
      합계: c.totalIncome,
      주문관리수수료: s.order_fee,
      매출연동수수료: s.sales_fee,
      수수료합계: c.totalFee,
      부가세: s.vat,
      실원가: s.product_cost,
      부자재원가: s.material_cost,
      포장비: s.packaging_cost,
      '택배비(비용)': s.shipping_cost,
      원가합계: c.totalCost,
      이익: c.profit,
      '마진율(%)': Number(c.marginRate.toFixed(1)),
      비고: s.memo || '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 },
    { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 20 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '온라인판매')
  XLSX.writeFile(wb, `온라인판매_${dateLabel}_${today()}.xlsx`)
}

export function downloadImportTemplate() {
  const headers = [
    '판매일', '상품주문번호', '상품명', '판매금액', '택배비(수입)',
    '주문관리수수료', '매출연동수수료', '부가세',
    '실원가', '부자재원가', '포장비', '택배비(비용)', '비고',
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers])
  ws['!cols'] = headers.map(() => ({ wch: 14 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '온라인판매')
  XLSX.writeFile(wb, `온라인판매_입력템플릿.xlsx`)
}
