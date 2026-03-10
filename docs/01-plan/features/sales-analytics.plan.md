# Plan: Sales Analytics (판매 내역 & 통계)

> **Created**: 2026-03-10
> **Feature**: sales-analytics
> **Phase**: Plan
> **Level**: Dynamic

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Sales Analytics (판매 내역 & 통계) |
| 작성일 | 2026-03-10 |
| 현재 단계 | Check ✅ (95% Match Rate) |
| 다음 단계 | /pdca report sales-analytics |

| 관점 | 내용 |
|------|------|
| **Problem** | 수강권/상품 판매 현황을 한눈에 파악할 수 없고, 마진/랭킹/추이 등 경영 판단에 필요한 통계가 없음 |
| **Solution** | `/sales` 페이지를 [내역]/[통계] 탭으로 확장하고, 상품/수강권 필터 및 recharts 기반 통계 시각화 추가 |
| **Function UX Effect** | 탭 전환만으로 내역↔통계 전환, 엑셀 내보내기로 정산 자동화, 랭킹/마진으로 재발주 의사결정 지원 |
| **Core Value** | 뜨개 공방 원장이 별도 엑셀 없이 CRM 안에서 매출 경영 분석을 완결할 수 있음 |

---

## 1. 배경 및 목적

KnitStore Manager는 현재 `/sales` 페이지에서 단순한 판매 내역 목록과 건수/금액 요약만 제공한다.
원장이 경영 판단을 위해 필요한 정보 — 수강권 vs 상품 매출 구분, 상품별 판매 랭킹, 마진, 추이 — 가 모두 누락되어 있다.

**목표**: 기존 `/sales` 페이지를 **[내역] / [통계]** 탭 구조로 확장하여 판매 분석 허브를 만든다.

---

## 2. 사용자 인텐트 (Intent Discovery)

| 질문 | 답변 |
|------|------|
| 핵심 문제 | 매출 현황 파악 + 정산/회계 + 재고·수강권 소진 예측 + 학생별 구매 이력 관리 (전부) |
| 주요 사용자 | 뜨개 공방 원장 (관리자) |
| 성공 기준 | 별도 엑셀 없이 CRM에서 월 정산, 인기 상품 파악, 마진율 확인이 가능한 상태 |
| 제약 사항 | 데이터량 수천~수만 건 수준 → 클라이언트 집계로 충분 |

---

## 3. 탐색한 대안

| 접근법 | 특징 | 선택 여부 |
|--------|------|-----------|
| **A: /sales 탭 확장** | 라우팅 변경 없음, 기존 페이지 재활용 | ✅ **선택** |
| B: /dashboard 신규 페이지 | 관심사 분리 명확하나 네비게이션 추가 필요 | ❌ |
| C: 최소 확장 (카드만) | 빠르지만 통계 깊이 부족 | ❌ |

---

## 4. YAGNI 검토 결과

### v1 포함

| 기능 | 분류 |
|------|------|
| 내역 탭: [전체]/[상품]/[수강권] 필터 | 내역 |
| 내역 탭: 수강권 판매 항목 표시 (subscription 조인) | 내역 |
| 통계 탭: 매출 추이 (기간별 합계 카드) | 통계 |
| 통계 탭: 상품별 판매 랭킹 (top N) | 통계 |
| 통계 탭: 수강권 유형별 배분율 (횟수권 vs 기간권) | 통계 |
| 통계 탭: 마진 계산 (판매가 - purchase_price) | 통계 |
| 엑셀 내보내기 (xlsx, 이미 설치됨) | 유틸 |
| recharts 차트 시각화 | 시각화 |

### Out of Scope (v1)

- 학생별 구매 이력 페이지 (학생 상세 페이지에서 별도 처리 예정)
- DB 통계 뷰 (데이터량 충분히 클라이언트 집계로 대응)
- 알림 / 자동 발주 제안

---

## 5. 기능 명세

### 5.1 내역 탭 (SalesHistoryTab)

- **기간 필터**: 오늘 / 이번 주 / 이번 달 / 전체 (기존 유지)
- **유형 필터**: [전체] [상품] [수강권] 탭
- **판매 행 (SaleRow)**: 상품 판매 시 품명/로트/수량/단가, 수강권 판매 시 수강권 유형/금액
- **요약 카드**: 선택 기간 내 판매 건수, 총 매출액

### 5.2 통계 탭 (SalesStatsTab)

#### 매출 추이

- 오늘 / 이번 주 / 이번 달 / 전체 기간의 매출 합계 카드 표시
- recharts BarChart 또는 LineChart로 일별 추이 시각화 (이번 달 선택 시)

#### 상품별 판매 랭킹

- `sale_items` → `lots` → `products` JOIN
- 상품별 `SUM(subtotal)`, `SUM(quantity)` 계산
- 상위 N개 테이블 + recharts BarChart

#### 수강권 유형별 배분율

- 횟수권(count) vs 기간권(period) 판매 건수 및 금액 비율
- recharts PieChart 또는 텍스트 + 진행 바

#### 마진 계산

- 상품 판매 항목: `SUM(subtotal) - SUM(quantity * purchase_price)`
- 전체 마진액 및 마진율 카드
- 상품별 마진 테이블

### 5.3 엑셀 내보내기

- 현재 활성 탭(내역/통계) + 선택 기간 기준 데이터 다운로드
- xlsx 라이브러리 사용 (이미 설치)
- 파일명: `판매내역_YYYYMMDD.xlsx` 또는 `판매통계_YYYYMMDD.xlsx`

---

## 6. 아키텍처 설계

### 6.1 디렉토리 구조

```
src/features/sales/           ← 신규 feature 폴더
├── components/
│   ├── SalesHistoryTab.tsx   (내역 탭)
│   ├── SalesStatsTab.tsx     (통계 탭 컨테이너)
│   ├── SaleRow.tsx           (판매 행, 상품/수강권 분기)
│   ├── ProductRanking.tsx    (상품별 랭킹)
│   ├── SubscriptionBreakdown.tsx (수강권 배분율)
│   └── MarginTable.tsx       (마진 계산)
├── hooks/
│   └── useSalesStats.ts      (통계 집계 쿼리)
└── utils/
    └── exportExcel.ts        (xlsx 내보내기)

src/app/(dashboard)/sales/page.tsx  ← 기존 파일 리팩토링
  → [내역] [통계] 탭 + 엑셀 내보내기 버튼
```

### 6.2 기존 코드 활용

- `src/features/pos/hooks/useSales.ts` — 기존 훅 재사용 (type 필터 파라미터 추가)
- `src/app/(dashboard)/sales/page.tsx` — 탭 구조로 리팩토링 (기존 SaleRow 로직 이동)

### 6.3 신규 설치 패키지

```bash
npm install recharts
npm install @types/recharts   # 필요 시
```

> `xlsx`는 이미 설치됨 (`"xlsx": "^0.18.5"`)

---

## 7. 데이터 플로우

```
[내역 탭]
useSales(shopId, from, to, type?)
  ↓
sales JOIN sale_items
  - type 파라미터로 'product_sale' | 'class_fee' | undefined 필터
  - 수강권 항목: sale_items.subscription_id → subscriptions JOIN

[통계 탭]
useSalesStats(shopId, from, to)
  ↓
  ├── 매출 추이: sales.created_at + total_amount 집계
  ├── 상품 랭킹: sale_items → lots → products, GROUP BY product_id
  ├── 마진: 랭킹 데이터 + products.purchase_price
  └── 수강권 배분: subscriptions.type COUNT / SUM

[엑셀 내보내기]
현재 필터 상태의 데이터 → xlsx.utils.json_to_sheet → 다운로드
```

---

## 8. 브레인스토밍 결정 로그

| Phase | 결정 | 근거 |
|-------|------|------|
| Intent | 4가지 목적 모두 포함 | 원장의 경영 전반 니즈 반영 |
| UI 구조 | 기존 /sales 탭 확장 | 네비게이션 변경 없이 점진적 확장 |
| DB 전략 | 클라이언트 집계 | 데이터량 수준에서 DB 뷰 불필요 |
| 차트 | recharts | shadcn 기본 권장, React 에코시스템 최적 |
| YAGNI | 전 기능 v1 포함 | 원장이 모든 기능을 즉시 활용 예정 |

---

## 9. 완료 조건 (Definition of Done)

- [x] `/sales` 페이지에 [내역] / [통계] 탭이 표시된다
- [x] 내역 탭에서 [전체] / [상품] / [수강권] 필터가 동작한다
- [x] 수강권 판매 항목에 수강권 유형과 금액이 표시된다
- [x] 통계 탭에서 기간별 매출 합계 카드가 표시된다
- [x] 상품별 판매 랭킹이 차트와 함께 표시된다
- [x] 수강권 유형별 배분율이 표시된다
- [x] 마진액 및 마진율이 상품별로 계산된다
- [x] 엑셀 내보내기 버튼으로 현재 데이터를 다운로드할 수 있다
- [x] recharts가 설치되고 차트가 정상 렌더링된다

---

## 10. 다음 단계

```
/pdca report sales-analytics
```
