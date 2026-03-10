import * as XLSX from 'xlsx'
import type { SaleWithItemsExtended, SalesStats } from '../types'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export function exportSalesHistory(sales: SaleWithItemsExtended[], dateLabel: string): void {
  const rows: Record<string, string | number>[] = []

  for (const sale of sales) {
    const dateStr = new Date(sale.created_at).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    const typeLabel = sale.type === 'product_sale' ? '상품판매' : '수강권판매'

    for (const item of sale.items) {
      const isProduct = !!item.product_name
      rows.push({
        날짜: dateStr,
        판매유형: typeLabel,
        '상품/수강권명': isProduct
          ? item.product_name ?? ''
          : item.subscription_type === 'count'
            ? `횟수권 ${item.subscription_total_count ?? ''}회`
            : '기간권',
        브랜드: isProduct ? (item.brand ?? '') : '',
        색상: isProduct ? (item.color_name ?? '') : '',
        로트번호: isProduct ? (item.lot_number ?? '') : '',
        수량: item.quantity,
        단가: item.unit_price,
        소계: item.subtotal,
        '판매합계(원)': sale.total_amount,
      })
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '판매내역')
  XLSX.writeFile(wb, `판매내역_${dateLabel}_${today()}.xlsx`)
}

export function exportSalesStats(stats: SalesStats, dateLabel: string): void {
  const wb = XLSX.utils.book_new()

  // 시트 1: 매출요약
  const summaryRows = [
    { 구분: '전체 매출', '금액(원)': stats.totalRevenue, 건수: '' },
    { 구분: '상품 매출', '금액(원)': stats.productRevenue, 건수: '' },
    { 구분: '수강권 매출', '금액(원)': stats.classRevenue, 건수: '' },
    { 구분: '전체 마진', '금액(원)': stats.totalMargin, 건수: `${stats.totalMarginRate.toFixed(1)}%` },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), '매출요약')

  // 시트 2: 상품랭킹
  const rankRows = stats.productRanking.map((item, i) => ({
    순위: i + 1,
    상품명: item.product_name,
    브랜드: item.brand,
    '수량(볼/g)': item.total_quantity,
    '매출(원)': item.total_revenue,
    '원가(원)': item.total_cost,
    '마진(원)': item.margin,
    '마진율(%)': item.margin_rate.toFixed(1),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rankRows), '상품랭킹')

  // 시트 3: 수강권배분
  const b = stats.subscriptionBreakdown
  const subRows = [
    {
      유형: '횟수권',
      건수: b.count_type_count,
      '금액(원)': b.count_type_revenue,
      '비율(%)': b.total_revenue > 0 ? ((b.count_type_revenue / b.total_revenue) * 100).toFixed(1) : '0',
    },
    {
      유형: '기간권',
      건수: b.period_type_count,
      '금액(원)': b.period_type_revenue,
      '비율(%)': b.total_revenue > 0 ? ((b.period_type_revenue / b.total_revenue) * 100).toFixed(1) : '0',
    },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subRows), '수강권배분')

  XLSX.writeFile(wb, `판매통계_${dateLabel}_${today()}.xlsx`)
}
