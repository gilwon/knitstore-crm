import bcryptjs from 'bcryptjs'
import type { NaverProductOrder, OnlineSaleInsert } from '../types'

const NAVER_API_BASE = 'https://api.commerce.naver.com/external'

// 1. OAuth 토큰 발급
export async function getNaverToken(clientId: string, clientSecret: string): Promise<string> {
  const timestamp = Date.now()
  // BCrypt 서명: client_id + "_" + timestamp
  const signatureBase = `${clientId}_${timestamp}`
  const signature = await bcryptjs.hash(signatureBase, 10)
  const signatureEncoded = Buffer.from(signature).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    timestamp: String(timestamp),
    client_secret_sign: signatureEncoded,
    grant_type: 'client_credentials',
    type: 'SELF',
  })

  const res = await fetch(`${NAVER_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) throw new Error(`토큰 발급 실패: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

// 2. 주문 목록 조회
export async function fetchNaverOrders(
  token: string,
  from: string, // "YYYY-MM-DD"
  to: string,
): Promise<NaverProductOrder[]> {
  // from/to를 KST ISO datetime으로 변환
  const fromDt = `${from}T00:00:00.000+09:00`
  const toDt = `${to}T23:59:59.999+09:00`

  const res = await fetch(
    `${NAVER_API_BASE}/v1/pay-order/seller/product-orders/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromDt,
        to: toDt,
        rangeType: 'PAYED',
      }),
    },
  )

  if (!res.ok) throw new Error(`주문 조회 실패: ${res.status}`)
  const data = await res.json()
  return data.data?.productOrders ?? []
}

// 3. 네이버 주문 → OnlineSaleInsert 변환
export function mapNaverOrderToSale(
  order: NaverProductOrder,
  shopId: string,
  costTemplates: { product_name: string; type: string; total_cost: number }[],
): OnlineSaleInsert {
  // 원가 템플릿 매칭
  let productCost = 0
  let materialCost = 0
  let packagingCost = 0
  for (const tpl of costTemplates) {
    if (tpl.product_name !== order.productName) continue
    if (tpl.type === 'product_cost') productCost = tpl.total_cost
    else if (tpl.type === 'material_cost') materialCost = tpl.total_cost
    else if (tpl.type === 'packaging') packagingCost = tpl.total_cost
  }

  return {
    shop_id: shopId,
    sale_date: order.paymentDate.substring(0, 10), // "YYYY-MM-DD"
    order_number: order.productOrderId,
    product_name: order.productName,
    sale_amount: Math.round(order.totalPaymentAmount),
    shipping_income: Math.round(order.deliveryFeeAmount),
    order_fee: Math.round(order.platformCommission),
    sales_fee: Math.round(order.salesCommission + (order.knowledgeShoppingCommission ?? 0)),
    vat: 0, // 네이버 API에서 별도 계산 필요 시 추가
    product_cost: productCost,
    material_cost: materialCost,
    packaging_cost: packagingCost,
    shipping_cost: Math.round(order.sellerBurdenDeliveryFee ?? 0),
    memo: '',
  }
}
