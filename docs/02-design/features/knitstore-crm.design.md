# KnitStore CRM Design Document

> **Summary**: 뜨개 공방 전용 CRM - 로트 기반 재고 + 수강생/수강권 + 통합 POS 상세 설계
>
> **Project**: KnitStore Manager
> **Version**: 0.1.0
> **Author**: gilwon
> **Date**: 2026-03-09
> **Status**: Draft
> **Planning Doc**: [knitstore-crm.plan.md](../../01-plan/features/knitstore-crm.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | 본 문서 Section 3에 포함 |
| Phase 2 | Coding Conventions | 본 문서 Section 10에 포함 |
| Phase 3 | Mockup | 본 문서 Section 5에 포함 |
| Phase 4 | API Spec | 본 문서 Section 4에 포함 |

---

## 1. Overview

### 1.1 Design Goals

- Supabase PostgreSQL 기반의 로트(Dye Lot) 정밀 재고 관리 시스템 구현
- 수강생/수강권 관리 및 출석 자동 차감 로직 구현
- 태블릿 최적화 POS UI로 실 판매 + 수강료를 단일 화면에서 처리
- RLS(Row Level Security)로 공방별 데이터 완전 격리

### 1.2 Design Principles

- **Simple First**: 강사가 10분 내 기본 조작 가능한 직관적 UI
- **Data Integrity**: 재고 가감은 트랜잭션 + stock_movements 이력으로 무결성 보장
- **Touch Friendly**: 44px+ 터치 타겟, 태블릿 레이아웃 우선 설계

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────┐
│   Client (Browser)   │
│   Next.js App Router │
│   + shadcn/ui        │
│   + Zustand (POS)    │
│   + TanStack Query   │
└──────────┬───────────┘
           │ Supabase Client SDK
           ▼
┌──────────────────────┐
│   Supabase           │
│   ├── Auth           │  ← 이메일 로그인/회원가입
│   ├── PostgreSQL     │  ← 재고/수강생/판매 데이터
│   ├── RLS Policies   │  ← 공방별 데이터 격리
│   └── Edge Functions │  ← 재고 가감 트랜잭션 (선택)
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Vercel (Hosting)   │
│   Next.js SSR/SSG    │
└──────────────────────┘
```

### 2.2 Data Flow

```
[입고 플로우]
입고 폼 입력 → validate → insert stock_movements(type:"in") → update lots.stock_quantity += qty → 화면 갱신

[출고 플로우]
출고 폼 입력 → validate → check stock_quantity >= qty → insert stock_movements(type:"out") → update lots.stock_quantity -= qty → 화면 갱신
                                                    └─ 부족 시 → 에러 toast "재고 부족"

[POS 판매 플로우]
상품 검색 → 로트 선택 → 수량 입력 → 로트 혼합 체크 → insert sale + sale_items → auto insert stock_movements(type:"out") → update lots.stock_quantity -= qty

[출석 체크 플로우]
수강생 선택 → 수강권 확인 → 출석 등록 → subscriptions.remaining -= 1 → 잔여 횟수 표시
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Inventory Feature | Supabase (products, lots, stock_movements) | 재고/로트 CRUD + 입출고 |
| Students Feature | Supabase (students, subscriptions, attendances) | 수강생/수강권 관리 |
| POS Feature | Inventory + Students + Supabase (sales, sale_items) | 통합 판매 화면 |
| Auth | Supabase Auth | 이메일 인증 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// 공방 (Shop)
interface Shop {
  id: string;                // UUID
  name: string;              // 공방명
  owner_id: string;          // auth.users FK
  created_at: string;
}

// 상품 (Product)
interface Product {
  id: string;                // UUID
  shop_id: string;           // shops FK
  brand: string;             // 브랜드 (예: 알리제)
  name: string;              // 상품명 (예: 코튼골드)
  color_code: string;        // 색상 번호 (예: #101)
  color_name: string;        // 색상명 (예: 레드)
  unit: 'ball' | 'g';        // 재고 단위
  price: number;             // 판매 단가 (단위당)
  alert_threshold: number;   // 재고 부족 알림 임계값 (0=미사용)
  created_at: string;
  updated_at: string;
}

// 로트 (Lot)
interface Lot {
  id: string;                // UUID
  product_id: string;        // products FK
  lot_number: string;        // 로트 번호 (예: LOT-2026-A)
  stock_quantity: number;    // 현재고 (입고합 - 출고합)
  created_at: string;
  updated_at: string;
}

// 재고 이동 (Stock Movement)
interface StockMovement {
  id: string;                // UUID
  lot_id: string;            // lots FK
  type: 'in' | 'out';       // 입고/출고
  quantity: number;          // 수량 (항상 양수)
  reason: string;            // 사유 (purchase/return/sale/disposal/adjustment)
  memo: string | null;       // 메모
  sale_item_id: string | null; // 판매 연동 시 sale_items FK
  created_at: string;
}

// 수강생 (Student)
interface Student {
  id: string;                // UUID
  shop_id: string;           // shops FK
  name: string;              // 이름
  phone: string | null;      // 연락처
  memo: string | null;       // 메모
  created_at: string;
  updated_at: string;
}

// 수강권 (Subscription)
interface Subscription {
  id: string;                // UUID
  student_id: string;        // students FK
  type: 'count' | 'period';  // 횟수제/기간제
  total_count: number | null; // 총 횟수 (횟수제)
  remaining: number | null;   // 잔여 횟수 (횟수제)
  starts_at: string;          // 시작일
  expires_at: string | null;  // 만료일 (기간제)
  price: number;              // 수강권 가격
  status: 'active' | 'expired' | 'exhausted'; // 상태
  created_at: string;
}

// 출석 (Attendance)
interface Attendance {
  id: string;                // UUID
  student_id: string;        // students FK
  subscription_id: string;   // subscriptions FK
  attended_at: string;       // 출석 일시
  memo: string | null;       // 메모
}

// 판매 (Sale)
interface Sale {
  id: string;                // UUID
  shop_id: string;           // shops FK
  type: 'product_sale' | 'class_fee'; // 실 판매/수강료
  total_amount: number;      // 총 금액
  student_id: string | null; // 수강생 연결 (선택)
  created_at: string;
}

// 판매 항목 (Sale Item)
interface SaleItem {
  id: string;                // UUID
  sale_id: string;           // sales FK
  lot_id: string | null;     // lots FK (실 판매 시)
  subscription_id: string | null; // subscriptions FK (수강료 시)
  quantity: number;          // 수량
  unit_price: number;        // 단가
  subtotal: number;          // 소계
}
```

### 3.2 Entity Relationships

```
[shops]
   │
   ├── 1──N [products]
   │            │
   │            └── 1──N [lots]
   │                       │
   │                       └── 1──N [stock_movements]
   │
   ├── 1──N [students]
   │            │
   │            ├── 1──N [subscriptions]
   │            │            │
   │            │            └── 1──N [attendances]
   │            │
   │            └── (판매 시 연결)
   │
   └── 1──N [sales]
                │
                └── 1──N [sale_items]
                            ├── → lots (실 판매)
                            └── → subscriptions (수강료)
```

### 3.3 Database Schema (Supabase PostgreSQL)

```sql
-- 1. shops
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  brand TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  color_code TEXT NOT NULL DEFAULT '',
  color_name TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL CHECK (unit IN ('ball', 'g')) DEFAULT 'ball',
  price INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. lots
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, lot_number)
);

-- 4. stock_movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL DEFAULT 'purchase',
  memo TEXT,
  sale_item_id UUID REFERENCES sale_items(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('count', 'period')),
  total_count INTEGER,
  remaining INTEGER,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'exhausted')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. attendances
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  memo TEXT
);

-- 8. sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product_sale', 'class_fee')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  student_id UUID REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. sale_items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id),
  subscription_id UUID REFERENCES subscriptions(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_lots_product_id ON lots(product_id);
CREATE INDEX idx_stock_movements_lot_id ON stock_movements(lot_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_students_shop_id ON students(shop_id);
CREATE INDEX idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
```

### 3.4 RLS Policies

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- shops: 본인 공방만 접근
CREATE POLICY "shops_owner" ON shops
  FOR ALL USING (owner_id = auth.uid());

-- products: 본인 공방 상품만 접근
CREATE POLICY "products_shop_owner" ON products
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- lots: 본인 공방 로트만 접근 (products 경유)
CREATE POLICY "lots_shop_owner" ON lots
  FOR ALL USING (product_id IN (
    SELECT p.id FROM products p
    JOIN shops s ON s.id = p.shop_id
    WHERE s.owner_id = auth.uid()
  ));

-- stock_movements: 본인 공방 이력만 접근 (lots → products → shops 경유)
CREATE POLICY "stock_movements_shop_owner" ON stock_movements
  FOR ALL USING (lot_id IN (
    SELECT l.id FROM lots l
    JOIN products p ON p.id = l.product_id
    JOIN shops s ON s.id = p.shop_id
    WHERE s.owner_id = auth.uid()
  ));

-- students, subscriptions, attendances, sales, sale_items: 동일 패턴
CREATE POLICY "students_shop_owner" ON students
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

CREATE POLICY "subscriptions_shop_owner" ON subscriptions
  FOR ALL USING (student_id IN (
    SELECT st.id FROM students st
    JOIN shops s ON s.id = st.shop_id
    WHERE s.owner_id = auth.uid()
  ));

CREATE POLICY "attendances_shop_owner" ON attendances
  FOR ALL USING (student_id IN (
    SELECT st.id FROM students st
    JOIN shops s ON s.id = st.shop_id
    WHERE s.owner_id = auth.uid()
  ));

CREATE POLICY "sales_shop_owner" ON sales
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

CREATE POLICY "sale_items_shop_owner" ON sale_items
  FOR ALL USING (sale_id IN (
    SELECT sa.id FROM sales sa
    JOIN shops s ON s.id = sa.shop_id
    WHERE s.owner_id = auth.uid()
  ));
```

### 3.5 Database Functions (재고 트랜잭션)

```sql
-- 입고 처리 함수
CREATE OR REPLACE FUNCTION process_stock_in(
  p_lot_id UUID,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT 'purchase',
  p_memo TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_movement_id UUID;
BEGIN
  -- 1. stock_movements에 입고 기록
  INSERT INTO stock_movements (lot_id, type, quantity, reason, memo)
  VALUES (p_lot_id, 'in', p_quantity, p_reason, p_memo)
  RETURNING id INTO v_movement_id;

  -- 2. lots 현재고 증가
  UPDATE lots SET stock_quantity = stock_quantity + p_quantity, updated_at = NOW()
  WHERE id = p_lot_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 출고 처리 함수
CREATE OR REPLACE FUNCTION process_stock_out(
  p_lot_id UUID,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT 'sale',
  p_memo TEXT DEFAULT NULL,
  p_sale_item_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- 1. 현재고 확인 (FOR UPDATE로 락)
  SELECT stock_quantity INTO v_current_stock
  FROM lots WHERE id = p_lot_id FOR UPDATE;

  -- 2. 재고 부족 체크
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: 현재고(%)가 출고 요청량(%)보다 적습니다', v_current_stock, p_quantity;
  END IF;

  -- 3. stock_movements에 출고 기록
  INSERT INTO stock_movements (lot_id, type, quantity, reason, memo, sale_item_id)
  VALUES (p_lot_id, 'out', p_quantity, p_reason, p_memo, p_sale_item_id)
  RETURNING id INTO v_movement_id;

  -- 4. lots 현재고 감소
  UPDATE lots SET stock_quantity = stock_quantity - p_quantity, updated_at = NOW()
  WHERE id = p_lot_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 출석 + 수강권 차감 함수
CREATE OR REPLACE FUNCTION process_attendance(
  p_student_id UUID,
  p_subscription_id UUID,
  p_memo TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_sub RECORD;
  v_attendance_id UUID;
BEGIN
  -- 1. 수강권 상태 확인
  SELECT * INTO v_sub FROM subscriptions
  WHERE id = p_subscription_id AND student_id = p_student_id FOR UPDATE;

  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_sub.status != 'active' THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_ACTIVE: 수강권 상태가 %입니다', v_sub.status;
  END IF;

  -- 2. 횟수제: 잔여 횟수 체크
  IF v_sub.type = 'count' AND v_sub.remaining <= 0 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXHAUSTED: 잔여 횟수가 없습니다';
  END IF;

  -- 3. 기간제: 만료일 체크
  IF v_sub.type = 'period' AND v_sub.expires_at < CURRENT_DATE THEN
    UPDATE subscriptions SET status = 'expired' WHERE id = p_subscription_id;
    RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED: 수강권이 만료되었습니다';
  END IF;

  -- 4. 출석 기록
  INSERT INTO attendances (student_id, subscription_id, memo)
  VALUES (p_student_id, p_subscription_id, p_memo)
  RETURNING id INTO v_attendance_id;

  -- 5. 횟수제: 잔여 횟수 차감
  IF v_sub.type = 'count' THEN
    UPDATE subscriptions
    SET remaining = remaining - 1,
        status = CASE WHEN remaining - 1 <= 0 THEN 'exhausted' ELSE 'active' END
    WHERE id = p_subscription_id;
  END IF;

  RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. API Specification

> Supabase Client SDK를 직접 사용하므로 별도 REST API 서버 불필요. 주요 쿼리 패턴만 정의.

### 4.1 Inventory API (Supabase Client)

| Operation | Method | Description | FR |
|-----------|--------|-------------|-----|
| `getProducts(shopId)` | SELECT | 상품 목록 조회 (로트 포함) | FR-01 |
| `createProduct(data)` | INSERT | 상품 등록 | FR-01 |
| `updateProduct(id, data)` | UPDATE | 상품 수정 | FR-01 |
| `deleteProduct(id)` | DELETE | 상품 삭제 | FR-01 |
| `getLotsByProduct(productId)` | SELECT | 상품별 로트 목록 | FR-04 |
| `createLot(data)` | INSERT | 로트 생성 | FR-02 |
| `processStockIn(lotId, qty, reason, memo)` | RPC | 입고 처리 (DB Function) | FR-02 |
| `processStockOut(lotId, qty, reason, memo)` | RPC | 출고 처리 (DB Function) | FR-03 |
| `getStockMovements(lotId)` | SELECT | 입출고 이력 조회 | FR-05 |
| `checkLotMix(productId, qty)` | SELECT + Logic | 로트 혼합 체크 | FR-06 |

### 4.2 Students API

| Operation | Method | Description | FR |
|-----------|--------|-------------|-----|
| `getStudents(shopId)` | SELECT | 수강생 목록 | FR-07 |
| `createStudent(data)` | INSERT | 수강생 등록 | FR-07 |
| `updateStudent(id, data)` | UPDATE | 수강생 수정 | FR-07 |
| `deleteStudent(id)` | DELETE | 수강생 삭제 | FR-07 |
| `getSubscriptions(studentId)` | SELECT | 수강권 목록 | FR-08 |
| `createSubscription(data)` | INSERT | 수강권 등록 | FR-08 |
| `processAttendance(studentId, subId)` | RPC | 출석 + 차감 (DB Function) | FR-09 |
| `getAttendances(studentId)` | SELECT | 출석 이력 | FR-09 |

### 4.3 POS/Sales API

| Operation | Method | Description | FR |
|-----------|--------|-------------|-----|
| `createProductSale(items)` | RPC/INSERT | 실 판매 처리 (sale + items + 출고) | FR-10 |
| `createClassFeeSale(subData)` | INSERT | 수강료 결제 처리 | FR-11 |
| `getSales(shopId, dateRange)` | SELECT | 판매 내역 조회 | - |

### 4.4 Auth API

| Operation | Method | Description | FR |
|-----------|--------|-------------|-----|
| `signUp(email, password)` | Supabase Auth | 회원가입 | FR-13 |
| `signIn(email, password)` | Supabase Auth | 로그인 | FR-13 |
| `signOut()` | Supabase Auth | 로그아웃 | FR-13 |
| `getSession()` | Supabase Auth | 세션 확인 | FR-13 |

### 4.5 Key Query Examples

```typescript
// 입고 처리
const { data, error } = await supabase.rpc('process_stock_in', {
  p_lot_id: lotId,
  p_quantity: 20,
  p_reason: 'purchase',
  p_memo: '3월 신규 입고분'
});

// 출고 처리 (재고 부족 시 에러)
const { data, error } = await supabase.rpc('process_stock_out', {
  p_lot_id: lotId,
  p_quantity: 5,
  p_reason: 'sale'
});
// error.message === 'INSUFFICIENT_STOCK: ...' → toast 표시

// 로트 혼합 체크: 특정 상품의 단일 로트로 qty를 충족하는지 확인
const { data: lots } = await supabase
  .from('lots')
  .select('id, lot_number, stock_quantity')
  .eq('product_id', productId)
  .gte('stock_quantity', requestedQty)
  .order('created_at', { ascending: true }); // FIFO

if (lots.length === 0) {
  // 단일 로트로 충족 불가 → 혼합 경고
  showLotMixWarning();
}

// 출석 + 수강권 차감
const { data, error } = await supabase.rpc('process_attendance', {
  p_student_id: studentId,
  p_subscription_id: subscriptionId
});
```

---

## 5. UI/UX Design

### 5.1 Screen Map

```
(auth)/
├── /login              로그인
└── /signup             회원가입 + 공방 생성

(dashboard)/
├── /inventory          재고 관리 (메인)
│   ├── 상품 목록 + 로트별 현재고
│   ├── [+상품등록] → 모달/시트
│   ├── [+입고] → 입고 시트
│   └── [+출고] → 출고 시트
│
├── /inventory/[productId]   상품 상세
│   ├── 로트 목록 + 현재고
│   └── 입출고 이력 탭
│
├── /students           수강생 관리
│   ├── 수강생 목록
│   ├── [+수강생등록] → 모달/시트
│   └── 수강생 클릭 → 상세
│
├── /students/[studentId]    수강생 상세
│   ├── 프로필 정보
│   ├── 수강권 목록 + 잔여 현황
│   ├── [출석체크] 버튼
│   └── 출석 이력
│
├── /pos                POS 통합 화면
│   ├── 실 판매 탭
│   │   ├── 상품 검색
│   │   ├── 로트 선택 + 수량
│   │   ├── 장바구니
│   │   └── [결제] 버튼
│   └── 수강료 탭
│       ├── 수강생 검색
│       ├── 수강권 선택/신규
│       └── [결제] 버튼
│
└── /settings           설정
    └── 공방 정보 수정
```

### 5.2 Key Screen Layouts

#### 재고 관리 (태블릿)

```
┌─ Sidebar ─┬──────────────────────────────────────────────┐
│            │  재고 관리                    [+상품] [+입고] │
│  📦 재고   │──────────────────────────────────────────────│
│  👩‍🎓 수강생 │  🔍 상품 검색...                              │
│  🏪 POS   │──────────────────────────────────────────────│
│  ⚙️ 설정   │  알리제 코튼골드 레드 #101        단위: 볼    │
│            │  ├── LOT-2026-A    현재고: 13볼    [입고][출고]│
│            │  ├── LOT-2025-K    현재고:  2볼 ⚠️ [입고][출고]│
│            │  └── LOT-2025-F    현재고:  0볼    [입고]     │
│            │                                              │
│            │  말리브리고 메리노 블루 #205       단위: g     │
│            │  ├── LOT-A1        현재고: 380g   [입고][출고]│
│            │  └── LOT-A2        현재고: 500g   [입고][출고]│
└────────────┴──────────────────────────────────────────────┘
```

#### 입고 등록 (Bottom Sheet)

```
┌──────────────────────────────────────┐
│  입고 등록                      [X]  │
│──────────────────────────────────────│
│  상품:  알리제 코튼골드 레드 #101     │
│  로트:  [LOT-2026-A      ▼]         │
│         [+ 새 로트 번호 입력]         │
│  수량:  [    20    ] 볼              │
│  사유:  [구매입고 ▼]                  │
│         (구매입고/반품입고/기타)        │
│  메모:  [3월 신규 입고분         ]    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        입고 등록               │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

#### POS 실 판매 (태블릿 전체화면)

```
┌──────────────────────┬───────────────────────┐
│  상품 검색             │  장바구니              │
│  🔍 코튼골드...        │                       │
│────────────────────── │  코튼골드 레드          │
│  알리제 코튼골드 레드   │  LOT-2026-A × 5볼     │
│  [LOT-2026-A: 13볼]   │  = ₩25,000            │
│  [LOT-2025-K:  2볼]⚠️ │                       │
│                       │  말리브리고 블루         │
│  말리브리고 메리노 블루  │  LOT-A1 × 100g       │
│  [LOT-A1: 380g]       │  = ₩12,000            │
│  [LOT-A2: 500g]       │───────────────────────│
│                       │  합계: ₩37,000         │
│                       │                       │
│                       │  ┌─────────────────┐  │
│                       │  │     결제 완료     │  │
│                       │  └─────────────────┘  │
└──────────────────────┴───────────────────────┘
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `AppSidebar` | `components/shared/` | 사이드바 내비게이션 |
| `ProductCard` | `features/inventory/components/` | 상품 + 로트 현재고 카드 |
| `LotBadge` | `features/inventory/components/` | 로트 현재고 뱃지 (부족 경고 포함) |
| `StockInSheet` | `features/inventory/components/` | 입고 등록 바텀시트 |
| `StockOutSheet` | `features/inventory/components/` | 출고 등록 바텀시트 |
| `MovementHistory` | `features/inventory/components/` | 입출고 이력 테이블 |
| `LotMixWarning` | `features/inventory/components/` | 로트 혼합 경고 다이얼로그 |
| `StudentCard` | `features/students/components/` | 수강생 카드 |
| `SubscriptionBadge` | `features/students/components/` | 수강권 잔여 뱃지 |
| `AttendanceButton` | `features/students/components/` | 출석 체크 버튼 |
| `PosProductTab` | `features/pos/components/` | POS 실 판매 탭 |
| `PosClassTab` | `features/pos/components/` | POS 수강료 탭 |
| `CartPanel` | `features/pos/components/` | POS 장바구니 패널 |
| `ProductSearchInput` | `features/pos/components/` | 상품 검색 입력 |

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| `INSUFFICIENT_STOCK` | 재고가 부족합니다 | 출고 시 현재고 < 요청량 | toast 에러 + 현재고 표시 |
| `LOT_MIX_WARNING` | 로트가 섞여 판매됩니다 | 단일 로트로 수량 미충족 | 확인 다이얼로그 (계속/취소) |
| `SUBSCRIPTION_EXHAUSTED` | 잔여 횟수가 없습니다 | 횟수제 수강권 소진 | toast 에러 + 수강권 갱신 유도 |
| `SUBSCRIPTION_EXPIRED` | 수강권이 만료되었습니다 | 기간제 만료 | toast 에러 + 수강권 갱신 유도 |
| `AUTH_ERROR` | 인증이 필요합니다 | 세션 만료 | 로그인 페이지 리다이렉트 |
| `DUPLICATE_LOT` | 이미 존재하는 로트입니다 | 동일 product+lot_number | toast 에러 + 기존 로트 입고 유도 |

### 6.2 Error Handling Pattern

```typescript
// TanStack Query + toast 패턴
const { mutate: stockIn } = useMutation({
  mutationFn: (params) => supabase.rpc('process_stock_in', params),
  onSuccess: () => {
    toast.success('입고가 완료되었습니다');
    queryClient.invalidateQueries({ queryKey: ['lots'] });
  },
  onError: (error) => {
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      toast.error('재고가 부족합니다');
    } else {
      toast.error('처리 중 오류가 발생했습니다');
    }
  },
});
```

---

## 7. Security Considerations

- [x] RLS 정책으로 공방별 데이터 완전 격리 (Section 3.4)
- [x] DB Function은 SECURITY DEFINER로 트랜잭션 무결성 보장
- [x] Supabase Auth 이메일 인증
- [ ] HTTPS (Vercel 기본 제공) — 배포 후 자동 적용
- [x] 입력값 클라이언트 + DB 레벨 이중 검증 (CHECK 제약조건)
- [x] stock_quantity >= 0 CHECK로 음수 재고 방지

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | 재고 가감 로직, 로트 혼합 체크, 수강권 차감 | Vitest |
| Integration Test | Supabase RPC 함수, RLS 정책 | Vitest + Supabase |
| E2E Test | 입고→판매→재고확인, 출석→수강권차감 | Playwright |

### 8.2 Test Cases (Key)

**재고 관리**
- [x] 입고 등록 시 stock_quantity가 정확히 증가하는지 — process_stock_in RPC: stock_quantity + p_quantity
- [x] 출고 등록 시 stock_quantity가 정확히 감소하는지 — process_stock_out RPC: stock_quantity - p_quantity
- [x] 현재고보다 많은 수량 출고 시 에러 발생하는지 — process_stock_out: RAISE EXCEPTION 'INSUFFICIENT_STOCK'
- [x] 현재고가 0 이하로 내려가지 않는지 (CHECK 제약) — migration: CHECK (stock_quantity >= 0)
- [x] POS 판매 시 stock_movements 자동 생성되는지 — useSale.ts: process_stock_out RPC가 stock_movements INSERT
- [x] 로트 혼합 경고가 올바르게 표시되는지 — LotMixWarning.tsx: 단일 로트 재고 부족 시 다이얼로그 표시
- [x] 재고 부족 알림 임계값이 정상 동작하는지 — alert_threshold 기반 재고 부족 배지 표시

**수강생 관리**
- [x] 횟수제 출석 시 remaining이 1 감소하는지 — process_attendance: remaining = remaining - 1
- [x] remaining이 0이면 출석 차단되는지 — process_attendance: RAISE EXCEPTION 'SUBSCRIPTION_EXHAUSTED'
- [x] 기간제 만료 후 출석 차단되는지 — process_attendance: RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED'
- [x] 수강권 상태(active/expired/exhausted)가 올바르게 전환되는지 — process_attendance: status CASE WHEN remaining-1<=0

**RLS**
- [x] 다른 공방의 데이터에 접근 불가한지 — migration: 전체 테이블 RLS 정책 적용

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI 컴포넌트, 페이지, 레이아웃 | `src/app/`, `src/components/`, `src/features/*/components/` |
| **Application** | React hooks, 쿼리/뮤테이션, 상태 관리 | `src/features/*/hooks/`, `src/features/*/queries.ts` |
| **Domain** | 타입, 인터페이스, 비즈니스 규칙 | `src/types/`, `src/features/*/types.ts` |
| **Infrastructure** | Supabase 클라이언트, 미들웨어 | `src/lib/supabase/` |

### 9.2 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| ProductCard, StockInSheet 등 | Presentation | `src/features/inventory/components/` |
| useProducts, useStockIn 등 | Application | `src/features/inventory/hooks/` |
| Product, Lot, StockMovement 타입 | Domain | `src/features/inventory/types.ts` |
| Supabase Client | Infrastructure | `src/lib/supabase/client.ts` |
| POS Zustand Store | Application | `src/features/pos/store.ts` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `ProductCard`, `StockInSheet` |
| Hooks | camelCase (use prefix) | `useProducts()`, `useStockIn()` |
| Functions | camelCase | `processStockIn()`, `checkLotMix()` |
| Constants | UPPER_SNAKE_CASE | `STOCK_REASONS`, `SUBSCRIPTION_TYPES` |
| Types/Interfaces | PascalCase | `Product`, `StockMovement` |
| Files (component) | PascalCase.tsx | `ProductCard.tsx` |
| Files (utility) | kebab-case.ts | `format-date.ts` |
| Folders | kebab-case | `features/inventory/` |
| DB tables | snake_case (복수형) | `stock_movements`, `sale_items` |
| DB columns | snake_case | `stock_quantity`, `lot_number` |

### 10.2 Language Convention

| 영역 | 언어 | 예시 |
|------|------|------|
| 코드 (변수, 함수, 타입) | 영문 | `stockQuantity`, `ProductCard` |
| UI 텍스트 | 한국어 | "입고 등록", "재고 부족" |
| 커밋 메시지 | 영문 | "feat: add stock-in processing" |
| 주석 | 한국어 허용 | `// 로트 혼합 체크` |

### 10.3 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | Server only |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   └── [productId]/page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   └── [studentId]/page.tsx
│   │   ├── pos/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx                  # → redirect to /inventory
├── components/
│   ├── ui/                       # shadcn/ui
│   └── shared/
│       ├── AppSidebar.tsx
│       └── PageHeader.tsx
├── features/
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── LotBadge.tsx
│   │   │   ├── StockInSheet.tsx
│   │   │   ├── StockOutSheet.tsx
│   │   │   ├── MovementHistory.tsx
│   │   │   └── LotMixWarning.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   ├── useLots.ts
│   │   │   ├── useStockIn.ts
│   │   │   ├── useStockOut.ts
│   │   │   └── useMovements.ts
│   │   ├── types.ts
│   │   └── queries.ts
│   ├── students/
│   │   ├── components/
│   │   │   ├── StudentCard.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   ├── SubscriptionBadge.tsx
│   │   │   ├── SubscriptionForm.tsx
│   │   │   └── AttendanceButton.tsx
│   │   ├── hooks/
│   │   │   ├── useStudents.ts
│   │   │   ├── useSubscriptions.ts
│   │   │   └── useAttendance.ts
│   │   ├── types.ts
│   │   └── queries.ts
│   ├── pos/
│   │   ├── components/
│   │   │   ├── PosProductTab.tsx
│   │   │   ├── PosClassTab.tsx
│   │   │   ├── CartPanel.tsx
│   │   │   └── ProductSearchInput.tsx
│   │   ├── hooks/
│   │   │   └── useCart.ts
│   │   ├── store.ts              # Zustand
│   │   └── types.ts
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   └── SignupForm.tsx
│       └── hooks/
│           └── useAuth.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts
└── types/
    └── database.ts               # Supabase 자동생성
```

### 11.2 Implementation Order

1. [x] **프로젝트 초기화**: Next.js + Supabase + shadcn/ui + TanStack Query 셋업
2. [x] **DB 스키마**: Supabase 마이그레이션 (tables + RLS + functions)
3. [x] **인증**: 회원가입/로그인 + 공방 자동 생성 + 미들웨어
4. [x] **공통 레이아웃**: AppSidebar + dashboard layout
5. [x] **상품 CRUD**: products 테이블 CRUD + UI
6. [x] **로트/재고**: lots 생성 + 입고(process_stock_in) + 출고(process_stock_out) + 이력
7. [x] **로트 혼합 경고**: 판매 시 단일 로트 충족 여부 체크
8. [x] **수강생 CRUD**: students 테이블 CRUD + UI
9. [x] **수강권**: subscriptions 등록 + 출석(process_attendance) + 자동 차감
10. [x] **POS 판매**: 실 판매 탭 (장바구니 → 결제 → 자동 출고)
11. [x] **POS 수강료**: 수강료 탭 (수강권 구매/연장)
12. [x] **재고 알림**: alert_threshold 기반 부족 알림 UI

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-09 | Initial draft | gilwon |
