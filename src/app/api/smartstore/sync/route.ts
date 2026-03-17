import { createClient } from '@/lib/supabase/server'
import { getNaverToken, fetchNaverOrders, mapNaverOrderToSale } from '@/features/online-sales/utils/smartstore'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: '인증 필요' }, { status: 401 })

    const body = await request.json()
    const { from, to, test } = body

    // 1. shop 정보 + API 자격 증명 조회
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, smartstore_client_id, smartstore_client_secret')
      .eq('owner_id', user.id)
      .single()

    if (shopError) throw shopError

    if (!shop?.smartstore_client_id || !shop?.smartstore_client_secret) {
      return Response.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 400 })
    }

    // 2. 토큰 발급
    const token = await getNaverToken(shop.smartstore_client_id, shop.smartstore_client_secret)

    // 연결 테스트 모드
    if (test) return Response.json({ success: true })

    // 3. 주문 조회
    const orders = await fetchNaverOrders(token, from, to)

    if (orders.length === 0) {
      return Response.json({ synced: 0, skipped: 0, total: 0, errors: [] })
    }

    // 4-5. 중복 체크 + 원가 템플릿 조회 (병렬)
    const orderNumbers = orders.map((o) => o.productOrderId)
    const [{ data: existing, error: existingError }, { data: templates, error: templatesError }] =
      await Promise.all([
        supabase.from('online_sales').select('order_number').eq('shop_id', shop.id).in('order_number', orderNumbers),
        supabase.from('packaging_templates').select('product_name, type, total_cost').eq('shop_id', shop.id),
      ])

    if (existingError) throw existingError
    if (templatesError) throw templatesError

    const existingSet = new Set((existing ?? []).map((e) => e.order_number))

    // 6. 신규 주문만 변환 + 벌크 INSERT
    const newOrders = orders.filter((o) => !existingSet.has(o.productOrderId))
    const inserts = newOrders.map((o) =>
      mapNaverOrderToSale(o, shop.id, templates ?? [])
    )

    let synced = 0
    const errors: string[] = []
    if (inserts.length > 0) {
      const { error } = await supabase.from('online_sales').insert(inserts)
      if (error) {
        // 벌크 실패 시 개별 INSERT 폴백
        for (const input of inserts) {
          const { error: itemError } = await supabase.from('online_sales').insert(input)
          if (itemError) errors.push(`${input.order_number}: ${itemError.message}`)
          else synced++
        }
      } else {
        synced = inserts.length
      }
    }

    return Response.json({
      synced,
      skipped: existingSet.size,
      total: orders.length,
      errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '동기화 중 오류가 발생했습니다'
    return Response.json({ error: message }, { status: 500 })
  }
}
