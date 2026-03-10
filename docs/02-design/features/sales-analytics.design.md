# Design: Sales Analytics (판매 내역 & 통계)

> **Created**: 2026-03-10
> **Feature**: sales-analytics
> **Phase**: Design
> **Plan Reference**: `docs/01-plan/features/sales-analytics.plan.md`

---

## 1. 컴포넌트 구조

### 1.1 파일 트리

```
src/
├── features/
│   └── sales/                        ← 신규 feature 폴더
│       ├── components/
│       │   ├── SalesHistoryTab.tsx   내역 탭 (필터 + 목록)
│       │   ├── SalesStatsTab.tsx     통계 탭 컨테이너
│       │   ├── SaleRow.tsx           판매 행 (상품/수강권 분기)
│       │   ├── ProductRanking.tsx    상품별 판매 랭킹 + 차트
│       │   ├── SubscriptionBreakdown.tsx  수강권 유형별 배분율
│       │   └── MarginTable.tsx       마진 계산 테이블
│       ├── hooks/
│       │   ├── useSalesWithSubs.ts   내역용 (subscription 조인)
│       │   └── useSalesStats.ts      통계 집계 쿼리
│       └── utils/
│           └── exportExcel.ts        xlsx 내보내기
│
└── app/
    └── (dashboard)/
        └── sales/
            └── page.tsx              ← 기존 파일 리팩토링 (탭 구조)
```

### 1.2 기존 파일 수정

| 파일 | 수정 내용 |
|------|-----------|
| `src/app/(dashboard)/sales/page.tsx` | [내역]/[통계] 탭 + 엑셀 내보내기 버튼 추가 |
| `src/features/pos/hooks/useSales.ts` | `type` 필터 파라미터 추가 (하위 호환) |

---

## 2. 타입 정의

### 2.1 내역 탭 타입

```typescript
// src/features/sales/types.ts

export type SaleTypeFilter = 'all' | 'product_sale' | 'class_fee'

export interface SubscriptionItemDetail {
  subscriptionId: string
  subscriptionType: 'count' | 'period'
  totalCount: number | null
  price: number
}

export interface SaleItemDetailExtended {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  // 상품 판매 필드
  lot_number?: string
  product_name?: string
  brand?: string
  color_name?: string
  unit?: 'ball' | 'g'
  // 수강권 판매 필드
  subscription_type?: 'count' | 'period'
  subscription_total_count?: number | null
}

export interface SaleWithItemsExtended {
  id: string
  type: 'product_sale' | 'class_fee'
  total_amount: number
  student_id: string | null
  student_name?: string
  created_at: string
  items: SaleItemDetailExtended[]
}
```

### 2.2 통계 탭 타입

```typescript
// 상품별 판매 랭킹
export interface ProductRankItem {
  product_id: string
  product_name: string
  brand: string
  total_revenue: number      // SUM(subtotal)
  total_quantity: number     // SUM(quantity)
  total_cost: number         // SUM(quantity * purchase_price)
  margin: number             // total_revenue - total_cost
  margin_rate: number        // margin / total_revenue * 100
}

// 수강권 유형별 배분
export interface SubscriptionBreakdownData {
  count_type_revenue: number     // 횟수권 매출
  count_type_count: number       // 횟수권 건수
  period_type_revenue: number    // 기간권 매출
  period_type_count: number      // 기간권 건수
  total_revenue: number
  total_count: number
}

// 통계 전체
export interface SalesStats {
  totalRevenue: number
  productRevenue: number
  classRevenue: number
  productRanking: ProductRankItem[]
  subscriptionBreakdown: SubscriptionBreakdownData
  totalMargin: number
  totalMarginRate: number
}

// 일별 매출 (차트용)
export interface DailySalesData {
  date: string     // 'MM/DD' 포맷
  revenue: number
  product: number
  class: number
}
```

---

## 3. 데이터 레이어 설계

### 3.1 useSalesWithSubs (내역 탭용)

**목적**: 기존 `useSales`에서 subscription 정보를 추가로 조인

```typescript
// src/features/sales/hooks/useSalesWithSubs.ts

// Supabase 쿼리:
supabase
  .from('sales')
  .select(`
    id, type, total_amount, student_id, created_at,
    students ( name ),
    sale_items (
      id, quantity, unit_price, subtotal,
      lots (
        lot_number,
        products ( name, brand, color_name, unit, purchase_price )
      ),
      subscriptions (
        type, total_count, price
      )
    )
  `)
  .eq('shop_id', shopId)
  .eq('type', typeFilter)   // 'all'이면 필터 제거
  .order('created_at', { ascending: false })
  .gte('created_at', from)
  .lte('created_at', to)
```

**파라미터**:
- `shopId: string`
- `from?: string`
- `to?: string`
- `typeFilter?: SaleTypeFilter` (기본값: 'all')

### 3.2 useSalesStats (통계 탭용)

**목적**: 통계 집계를 위한 상세 데이터 조회 + 클라이언트 집계

```typescript
// src/features/sales/hooks/useSalesStats.ts

// 1단계: 상품 판매 데이터 (product_sale만)
supabase
  .from('sales')
  .select(`
    id, total_amount, created_at,
    sale_items (
      quantity, subtotal,
      lots (
        lot_number,
        products ( id, name, brand, purchase_price )
      )
    )
  `)
  .eq('shop_id', shopId)
  .eq('type', 'product_sale')
  .gte('created_at', from)
  .lte('created_at', to)

// 2단계: 수강권 판매 데이터 (class_fee만)
supabase
  .from('sales')
  .select(`
    id, total_amount, created_at,
    sale_items (
      quantity, subtotal,
      subscriptions ( type, total_count )
    )
  `)
  .eq('shop_id', shopId)
  .eq('type', 'class_fee')
  .gte('created_at', from)
  .lte('created_at', to)

// 클라이언트 집계 함수:
function computeStats(productSales, classSales): SalesStats {
  // 상품 랭킹: product_id로 GROUP
  // 수강권 배분: subscription.type으로 COUNT
  // 마진: subtotal - quantity * purchase_price
  // 일별 추이: created_at DATE 기준 GROUP
}
```

**쿼리 키**: `['salesStats', shopId, from, to]`

### 3.3 기존 useSales 수정 (type 필터 추가)

```typescript
// src/features/pos/hooks/useSales.ts 수정
// typeFilter 파라미터 추가 (기존 호출자 하위 호환 유지)

export function useSales(
  shopId: string | undefined,
  from?: string,
  to?: string,
  typeFilter?: 'product_sale' | 'class_fee'  // 신규
)
```

> 기존 `/sales` page.tsx는 `useSalesWithSubs`로 교체하므로 실질적으로는 참조만 유지.

---

## 4. 컴포넌트 상세 명세

### 4.1 `page.tsx` (리팩토링)

```
상태:
  - activeTab: 'history' | 'stats'
  - dateRange: 'today' | 'week' | 'month' | 'all'
  - typeFilter: SaleTypeFilter (내역 탭용)

레이아웃:
  헤더
    - 제목: "판매 내역"
    - 오른쪽: [엑셀 내보내기 버튼] [내역 | 통계 탭]
  기간 필터 (오늘 / 이번 주 / 이번 달 / 전체)
  본문: activeTab에 따라 SalesHistoryTab or SalesStatsTab 렌더
```

### 4.2 `SalesHistoryTab.tsx`

```
Props: { shopId, from, to, dateRange }
데이터: useSalesWithSubs(shopId, from, to, typeFilter)

레이아웃:
  유형 필터 탭: [전체] [상품] [수강권]
  요약 카드 2개: 판매 건수 / 총 매출액
  판매 목록: sales.map → SaleRow
```

### 4.3 `SaleRow.tsx`

```
Props: { sale: SaleWithItemsExtended }
상태: open (아코디언)

펼쳤을 때 items 렌더:
  - lot_id 있는 item (상품): 브랜드 + 품명 + 색상 + 로트번호 + 수량 × 단가 = 소계
  - subscription_id 있는 item (수강권): [횟수권 N회 / 기간권] + 금액
```

### 4.4 `SalesStatsTab.tsx`

```
Props: { shopId, from, to, dateRange }
데이터: useSalesStats(shopId, from, to)

레이아웃 (세로 스크롤):
  [섹션 1] 매출 요약 카드 (3개)
    - 전체 매출 / 상품 매출 / 수강권 매출
  [섹션 2] 일별 매출 추이 차트 (month 선택 시만 표시)
    - recharts BarChart (상품/수강권 스택)
  [섹션 3] 상품별 판매 랭킹
    - ProductRanking 컴포넌트
  [섹션 4] 수강권 유형별 배분율
    - SubscriptionBreakdown 컴포넌트
  [섹션 5] 마진 분석
    - MarginTable 컴포넌트
```

### 4.5 `ProductRanking.tsx`

```
Props: { items: ProductRankItem[] }

레이아웃:
  수평 BarChart (recharts): 상위 8개 상품, X축 = 매출액
  테이블:
    순위 | 상품명 | 수량 | 매출액 | 원가 | 마진 | 마진율
  (마진율 낮으면 빨간색, 높으면 초록색 배지)
```

### 4.6 `SubscriptionBreakdown.tsx`

```
Props: { data: SubscriptionBreakdownData }

레이아웃:
  PieChart (recharts): 횟수권 vs 기간권 매출 비율
  통계 카드 2개:
    횟수권: N건 / X원
    기간권: N건 / X원
```

### 4.7 `MarginTable.tsx`

```
Props: { items: ProductRankItem[], totalMargin: number, totalMarginRate: number }

레이아웃:
  요약 카드 (전체 마진액 / 마진율)
  테이블: 상품별 마진 내역 (ProductRanking과 동일 데이터 재사용)
  주의: purchase_price = 0인 상품은 "-" 표시
```

### 4.8 `exportExcel.ts`

```typescript
// src/features/sales/utils/exportExcel.ts

export function exportSalesHistory(sales: SaleWithItemsExtended[], dateLabel: string): void
// 시트 구조: 날짜 | 유형 | 상품/수강권 | 수량 | 단가 | 소계 | 합계

export function exportSalesStats(stats: SalesStats, dateLabel: string): void
// 시트 1: 매출 요약
// 시트 2: 상품별 랭킹 + 마진
// 시트 3: 수강권 배분
```

---

## 5. recharts 사용 명세

### 5.1 설치

```bash
npm install recharts
```

> recharts에는 자체 TypeScript 타입이 포함되어 있어 별도 `@types/recharts` 불필요.

### 5.2 일별 매출 BarChart (SalesStatsTab)

```tsx
<BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={40} />
  <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
  <Bar dataKey="product" name="상품" stackId="a" fill="#6366f1" radius={[0,0,0,0]} />
  <Bar dataKey="class" name="수강권" stackId="a" fill="#a78bfa" radius={[4,4,0,0]} />
</BarChart>
```

### 5.3 상품 랭킹 BarChart (ProductRanking)

```tsx
<BarChart data={topItems} layout="vertical">
  <XAxis type="number" tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
  <YAxis type="category" dataKey="product_name" width={80} tick={{ fontSize: 11 }} />
  <Bar dataKey="total_revenue" fill="#6366f1" radius={[0,4,4,0]} />
</BarChart>
```

### 5.4 수강권 PieChart (SubscriptionBreakdown)

```tsx
<PieChart>
  <Pie
    data={[
      { name: '횟수권', value: data.count_type_revenue },
      { name: '기간권', value: data.period_type_revenue },
    ]}
    cx="50%" cy="50%"
    innerRadius={50} outerRadius={80}
    dataKey="value"
  >
    <Cell fill="#6366f1" />
    <Cell fill="#a78bfa" />
  </Pie>
  <Legend />
  <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
</PieChart>
```

---

## 6. 엑셀 내보내기 스펙

### 6.1 내역 탭 엑셀 (판매내역_YYYYMMDD.xlsx)

| 컬럼 | 내용 |
|------|------|
| 날짜 | YYYY-MM-DD HH:mm |
| 판매유형 | 상품판매 / 수강권판매 |
| 상품/수강권명 | |
| 브랜드 | 상품만 |
| 색상 | 상품만 |
| 로트번호 | 상품만 |
| 수량 | |
| 단가 | |
| 소계 | |
| 판매 합계 | 행 병합 (sale 단위) |

### 6.2 통계 탭 엑셀 (판매통계_YYYYMMDD.xlsx)

**시트 1: 매출요약**

| 구분 | 금액 | 건수 |
|------|------|------|
| 전체 매출 | | |
| 상품 매출 | | |
| 수강권 매출 | | |
| 전체 마진 | | |

**시트 2: 상품랭킹**

| 순위 | 상품명 | 브랜드 | 수량 | 매출 | 원가 | 마진 | 마진율 |
|------|--------|--------|------|------|------|------|--------|

**시트 3: 수강권배분**

| 유형 | 건수 | 금액 | 비율 |
|------|------|------|------|
| 횟수권 | | | |
| 기간권 | | | |

---

## 7. 구현 순서

1. **패키지 설치**: `npm install recharts`
2. **타입 파일**: `src/features/sales/types.ts` 생성
3. **훅**: `useSalesWithSubs.ts`, `useSalesStats.ts` 생성
4. **유틸**: `exportExcel.ts` 생성
5. **컴포넌트**: `SaleRow` → `SalesHistoryTab` → `ProductRanking` → `SubscriptionBreakdown` → `MarginTable` → `SalesStatsTab` 순서
6. **페이지 리팩토링**: `sales/page.tsx` — 탭 구조 + 엑셀 버튼

---

## 8. 완료 조건 (Design 상세)

| # | 조건 | 검증 방법 |
|---|------|-----------|
| 1 | [내역]/[통계] 탭 전환 | 클릭 시 렌더 전환 확인 |
| 2 | [전체]/[상품]/[수강권] 필터 | 각 필터 선택 시 목록 필터링 |
| 3 | 수강권 판매 행에 유형 표시 | class_fee sale에서 '횟수권' or '기간권' 배지 |
| 4 | 매출 요약 카드 3개 | 전체/상품/수강권 금액 표시 |
| 5 | 일별 추이 BarChart | '이번 달' 선택 시 차트 표시 |
| 6 | 상품 랭킹 테이블 + 차트 | top N 상품 표시 |
| 7 | 수강권 배분 PieChart | 횟수권/기간권 비율 |
| 8 | 마진 카드 + 테이블 | 마진액, 마진율 수치 정확성 |
| 9 | 엑셀 내보내기 | 파일 다운로드 + 내용 검증 |
| 10 | recharts 차트 렌더 | 빈 데이터 시 빈 상태 UI |

---

## 9. 다음 단계

```
/pdca do sales-analytics
```

구현 시작 전 체크리스트:
- [ ] `npm install recharts` 실행
- [ ] `src/features/sales/` 디렉토리 생성
- [ ] Plan 문서 DoD 9개 항목 확인
