import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

export async function buildAndDownloadBackup(shopName: string) {
  const supabase = createClient()

  const [products, lots, students, subscriptions, sales, attendances] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('lots').select('*, product:products(name)').order('created_at'),
    supabase.from('students').select('*').order('name'),
    supabase.from('subscriptions').select('*, student:students(name)').order('created_at'),
    supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false }).limit(1000),
    supabase.from('attendances').select('*, student:students(name), subscription:subscriptions(type)').order('attended_at', { ascending: false }).limit(1000),
  ])

  const wb = XLSX.utils.book_new()

  // 상품 시트
  const productRows = (products.data ?? []).map((p) => ({
    '상품명': p.name,
    '브랜드': p.brand,
    '색상번호': p.color_code,
    '색상명': p.color_name,
    '단위': p.unit,
    '판매단가': p.price,
    '구매단가': p.purchase_price,
    '부족알림수량': p.alert_threshold,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productRows), '상품')

  // 로트 시트
  const lotRows = (lots.data ?? []).map((l: any) => ({
    '상품명': l.product?.name ?? '',
    '로트번호': l.lot_number,
    '재고수량': l.stock_quantity,
    '등록일': new Date(l.created_at).toLocaleDateString('ko-KR'),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lotRows), '로트')

  // 수강생 시트
  const studentRows = (students.data ?? []).map((s) => ({
    '이름': s.name,
    '연락처': s.phone ?? '',
    '메모': s.memo ?? '',
    '등록일': new Date(s.created_at).toLocaleDateString('ko-KR'),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), '수강생')

  // 수강권 시트
  const subRows = (subscriptions.data ?? []).map((s: any) => ({
    '수강생': s.student?.name ?? '',
    '유형': s.type === 'count' ? '횟수제' : '기간제',
    '상태': s.status === 'active' ? '활성' : s.status === 'expired' ? '만료' : '소진',
    '총횟수': s.total_count ?? '',
    '잔여': s.remaining ?? '',
    '시작일': new Date(s.starts_at).toLocaleDateString('ko-KR'),
    '종료일': s.expires_at ? new Date(s.expires_at).toLocaleDateString('ko-KR') : '',
    '가격': s.price,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subRows), '수강권')

  // 판매 시트
  const saleRows = (sales.data ?? []).map((s) => ({
    '판매일': new Date(s.created_at).toLocaleString('ko-KR'),
    '유형': s.type === 'product_sale' ? '상품판매' : '수강료',
    '금액': s.total_amount,
    '항목수': (s as any).sale_items?.length ?? 0,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(saleRows), '판매이력')

  // 출결 시트
  const attRows = (attendances.data ?? []).map((a: any) => ({
    '수강생': a.student?.name ?? '',
    '수강권유형': a.subscription?.type === 'count' ? '횟수제' : '기간제',
    '출석일시': new Date(a.attended_at).toLocaleString('ko-KR'),
    '메모': a.memo ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows), '출결이력')

  const today = new Date().toISOString().slice(0, 10)
  const safeName = shopName.replace(/[/\\?%*:|"<>]/g, '_')
  XLSX.writeFile(wb, `${safeName}_backup_${today}.xlsx`)
}
