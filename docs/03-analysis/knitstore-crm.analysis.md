# KnitStore CRM Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: KnitStore Manager
> **Version**: 0.1.0
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-03-10
> **Design Doc**: [knitstore-crm.design.md](../02-design/features/knitstore-crm.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design Document (Section 5.3 Component List + Section 11.1 File Structure)에 명시된 컴포넌트, 훅, 페이지, 공유 컴포넌트가 실제 코드에 존재하고 설계 의도대로 구현되었는지 확인한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/knitstore-crm.design.md`
- **Implementation Path**: `src/` (features/, app/, components/, types/)
- **Analysis Date**: 2026-03-10

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Component Structure (Section 5.3 + 11.1)

#### Inventory Feature

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| `ProductCard.tsx` | `src/features/inventory/components/ProductCard.tsx` | ✅ Match | |
| `ProductForm.tsx` | `src/features/inventory/components/ProductForm.tsx` | ✅ Match | |
| `LotBadge.tsx` | `src/features/inventory/components/LotBadge.tsx` | ✅ Match | |
| `StockInSheet.tsx` | `src/features/inventory/components/StockInSheet.tsx` | ✅ Match | |
| `StockOutSheet.tsx` | `src/features/inventory/components/StockOutSheet.tsx` | ✅ Match | |
| `MovementHistory.tsx` | `src/features/inventory/components/MovementHistory.tsx` | ✅ Match | |
| `LotMixWarning.tsx` | `src/features/inventory/components/LotMixWarning.tsx` | ✅ Match | |
| `useProducts.ts` | `src/features/inventory/hooks/useProducts.ts` | ✅ Match | 추가로 useProduct(id), useCreateProduct, useUpdateProduct, useDeleteProduct 포함 |
| `useLots.ts` | `src/features/inventory/hooks/useLots.ts` | ✅ Match | useStockIn, useStockOut, useProductMovements가 여기에 병합 |
| `useStockIn.ts` | `src/features/inventory/hooks/useLots.ts` (merged) | ⚠️ Merged | 별도 파일 대신 useLots.ts 안에 useStockIn() export |
| `useStockOut.ts` | `src/features/inventory/hooks/useLots.ts` (merged) | ⚠️ Merged | 별도 파일 대신 useLots.ts 안에 useStockOut() export |
| `useMovements.ts` | `src/features/inventory/hooks/useLots.ts` (merged) | ⚠️ Merged | useProductMovements()로 useLots.ts에 병합 |
| `types.ts` | `src/features/inventory/types.ts` | ✅ Match | |
| `queries.ts` | - | ❌ Missing | 설계에 명시, 미구현 (쿼리 로직은 hooks에 inline) |

#### Students Feature

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| `StudentCard.tsx` | `src/features/students/components/StudentCard.tsx` | ✅ Match | |
| `StudentForm.tsx` | `src/features/students/components/StudentForm.tsx` | ✅ Match | |
| `SubscriptionBadge.tsx` | `src/features/students/components/SubscriptionBadge.tsx` | ✅ Match | |
| `SubscriptionForm.tsx` | `src/features/students/components/SubscriptionForm.tsx` | ✅ Match | |
| `AttendanceButton.tsx` | `src/features/students/components/AttendanceButton.tsx` | ✅ Match | |
| `useStudents.ts` | `src/features/students/hooks/useStudents.ts` | ✅ Match | useStudent(id), CRUD hooks 포함 |
| `useSubscriptions.ts` | `src/features/students/hooks/useSubscriptions.ts` | ✅ Match | useCreateSubscription |
| `useAttendance.ts` | `src/features/students/hooks/useAttendance.ts` | ✅ Match | useAttend() 함수명 (설계: useAttendance) |
| `types.ts` | `src/features/students/types.ts` | ✅ Match | |
| `queries.ts` | - | ❌ Missing | 설계에 명시, 미구현 (쿼리 로직은 hooks에 inline) |

#### POS Feature

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| `PosProductTab.tsx` | `src/features/pos/components/ProductSearchPanel.tsx` | ⚠️ Renamed | 역할 동일: 상품 검색 + 로트 선택. 이름만 변경 |
| `PosClassTab.tsx` | `src/features/pos/components/PosClassTab.tsx` | ✅ Match | 수강생 검색 + 수강권 선택 + class_fee 결제 구현 |
| `CartPanel.tsx` | `src/features/pos/components/CartPanel.tsx` | ✅ Match | |
| `ProductSearchInput.tsx` | `src/features/pos/components/LotPickerDialog.tsx` | ⚠️ Changed | 설계: 검색 입력 컴포넌트 -> 구현: 로트 선택 다이얼로그. ProductSearchPanel에 검색 기능 내장 |
| `useCart.ts` | - | ❌ Missing | Zustand store 대신 PosPage에서 useState로 장바구니 관리 |
| `store.ts` (Zustand) | `src/features/pos/store.ts` | ✅ Match | useCartStore: addItem, updateQty, removeItem, clear |
| `types.ts` | `src/features/pos/types.ts` | ✅ Match | CartItem 타입 |

#### Auth Feature

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| `LoginForm.tsx` | `src/features/auth/components/LoginForm.tsx` | ✅ Match | |
| `SignupForm.tsx` | `src/features/auth/components/SignupForm.tsx` | ✅ Match | |
| `useAuth.ts` | `src/features/auth/hooks/useAuth.ts` | ✅ Match | useSignUp, useSignIn, useSignOut (3개 분리 export) |

#### Shared Components

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| `AppSidebar.tsx` | `src/components/shared/AppSidebar.tsx` | ✅ Match | |
| `PageHeader.tsx` | - | ❌ Missing | 각 페이지에서 inline header 구현 |

#### Pages (App Router)

| Design Page | Implementation File | Status | Notes |
|-------------|---------------------|--------|-------|
| `(auth)/login/page.tsx` | `src/app/(auth)/login/page.tsx` | ✅ Match | |
| `(auth)/signup/page.tsx` | `src/app/(auth)/signup/page.tsx` | ✅ Match | |
| `(auth)/layout.tsx` | `src/app/(auth)/layout.tsx` | ✅ Match | |
| `(dashboard)/inventory/page.tsx` | `src/app/(dashboard)/inventory/page.tsx` | ✅ Match | |
| `(dashboard)/inventory/[productId]/page.tsx` | `src/app/(dashboard)/inventory/[productId]/page.tsx` | ✅ Match | |
| `(dashboard)/students/page.tsx` | `src/app/(dashboard)/students/page.tsx` | ✅ Match | |
| `(dashboard)/students/[studentId]/page.tsx` | `src/app/(dashboard)/students/[studentId]/page.tsx` | ✅ Match | |
| `(dashboard)/pos/page.tsx` | `src/app/(dashboard)/pos/page.tsx` | ✅ Match | |
| `(dashboard)/settings/page.tsx` | `src/app/(dashboard)/settings/page.tsx` | ✅ Match | |
| `(dashboard)/layout.tsx` | `src/app/(dashboard)/layout.tsx` | ✅ Match | |
| `layout.tsx` (root) | `src/app/layout.tsx` | ✅ Match | |
| `page.tsx` (root redirect) | `src/app/page.tsx` | ✅ Match | |

#### Data Model (Section 3)

| Design Entity | Implementation Type | Status | Notes |
|---------------|---------------------|--------|-------|
| Shop | `database.ts` Shop | ✅ Match | 4 fields 일치 |
| Product | `database.ts` Product | ✅ Match | 10 fields 일치 |
| Lot | `database.ts` Lot | ✅ Match | 6 fields 일치 |
| StockMovement | `database.ts` StockMovement | ✅ Match | 7 fields 일치 |
| Student | `database.ts` Student | ✅ Match | 6 fields 일치 |
| Subscription | `database.ts` Subscription | ✅ Match | 9 fields 일치 |
| Attendance | `database.ts` Attendance | ✅ Match | 5 fields 일치 |
| Sale | `database.ts` Sale | ✅ Match | 6 fields 일치 |
| SaleItem | `database.ts` SaleItem | ✅ Match | 7 fields 일치 |

#### DB Functions (Section 3.5)

| Design Function | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| `process_stock_in` | `database.ts` Functions + migration SQL | ✅ Match | RPC 호출 확인 (useLots.ts) |
| `process_stock_out` | `database.ts` Functions + migration SQL | ✅ Match | INSUFFICIENT_STOCK 에러 핸들링 포함 |
| `process_attendance` | `database.ts` Functions + migration SQL | ✅ Match | RPC 호출 확인 (useAttendance.ts) |

### 2.2 Functional Requirements

| FR | Description | Status | Evidence |
|----|-------------|--------|----------|
| FR-01 | 상품 CRUD | ✅ | useCreateProduct, useUpdateProduct, useDeleteProduct, ProductForm |
| FR-02 | 로트 생성 + 입고 (process_stock_in RPC) | ✅ | useStockIn: 새 로트 생성 + rpc('process_stock_in') |
| FR-03 | 출고 (process_stock_out RPC) | ✅ | useStockOut: rpc('process_stock_out') + INSUFFICIENT_STOCK 처리 |
| FR-04 | 로트별 현재고 조회 | ✅ | useProducts: select('*, lots(*)') -> lots.stock_quantity |
| FR-05 | 입출고 이력 조회 | ✅ | useProductMovements: stock_movements 조회 |
| FR-06 | 로트 혼합 경고 (LotMixWarning) | ✅ | LotMixWarning.tsx 존재 |
| FR-07 | 수강생 CRUD | ✅ | useCreateStudent, useUpdateStudent, useDeleteStudent, StudentForm |
| FR-08 | 수강권 등록 | ✅ | useCreateSubscription, SubscriptionForm |
| FR-09 | 출석 체크 + 자동 차감 (process_attendance RPC) | ✅ | useAttend: rpc('process_attendance') |
| FR-10 | POS 실 판매 (sale + sale_items + 자동 출고) | ✅ | useCheckout: insert sale -> insert sale_items -> rpc('process_stock_out') |
| FR-11 | POS 수강료 탭 (PosClassTab) | ✅ | PosClassTab.tsx 구현. POS 페이지 Tabs로 실 판매/수강료 탭 분리 |

### 2.3 Added (Design X, Implementation O)

| Item | Implementation Location | Description |
|------|------------------------|-------------|
| `ExcelImportDialog.tsx` | `src/features/inventory/components/` | 엑셀 파일로 상품+초기재고 일괄 업로드 기능 |
| `LotPickerDialog.tsx` | `src/features/pos/components/` | POS에서 로트 선택 전용 다이얼로그 |
| `AttendanceHistory.tsx` | `src/features/students/components/` | 출석 이력 표시 컴포넌트 |
| `useShop.ts` | `src/features/inventory/hooks/` | 현재 로그인 사용자의 shop 조회 훅 |
| `useProduct(id)` | `src/features/inventory/hooks/useProducts.ts` | 단일 상품 상세 조회 훅 |
| `useSale.ts` (useCheckout) | `src/features/pos/hooks/` | POS 결제 처리 뮤테이션 훅 |
| `useSales.ts` | `src/features/pos/hooks/` | 판매 내역 조회 훅 |
| `useSettings.ts` | `src/features/settings/hooks/` | 공방 설정, 비밀번호 변경 훅 |
| `utils.ts` | `src/features/inventory/` | 인벤토리 유틸 함수 |
| `QueryProvider.tsx` | `src/components/shared/` | TanStack Query Provider |
| `(dashboard)/sales/page.tsx` | `src/app/(dashboard)/sales/` | 판매 내역 페이지 (설계에 없음) |

### 2.4 Match Rate Summary

```
+-----------------------------------------------+
|  Overall Match Rate: 87%  (updated 2026-03-10) |
+-----------------------------------------------+
|  ✅ Match:           42 items (76%)            |
|  ⚠️ Partial/Merged:   5 items (9%)            |
|  ❌ Not implemented:   4 items (7%)            |
|  ⚠️ Added (not in design): 11 items (-)        |
+-----------------------------------------------+
```

**51 Design Items Total (components + hooks + pages + shared + queries files)**

- ✅ Match: 42 (PosClassTab, store.ts, SubscriptionBadge 신규 구현)
- ⚠️ Partial (renamed/merged): 5 (useStockIn merged, useStockOut merged, useMovements merged, PosProductTab renamed, ProductSearchInput changed)
- ❌ Missing: 4 (queries.ts x2, useCart, PageHeader)

---

## 3. Clean Architecture Compliance

### 3.1 Layer Dependency Verification

| Layer | Expected Dependencies | Actual Dependencies | Status |
|-------|----------------------|---------------------|--------|
| Presentation (components/) | Application hooks, Domain types | hooks/use*.ts, types.ts, @/components/ui | ✅ |
| Application (hooks/) | Domain types, Infrastructure (supabase) | @/lib/supabase/client, @/types/database, sonner | ✅ |
| Domain (types.ts) | None or @/types/database only | @/types/database | ✅ |
| Infrastructure (@/lib/supabase) | Domain types only | @supabase/ssr, next/headers | ✅ |

### 3.2 Dependency Violations

| File | Layer | Violation | Severity |
|------|-------|-----------|----------|
| `ExcelImportDialog.tsx` | Presentation | Directly imports `@/lib/supabase/client` and performs Supabase operations inline | Minor |

1건의 경미한 위반: ExcelImportDialog는 프레젠테이션 레이어에서 직접 인프라(supabase) 접근. 단, 이 컴포넌트는 설계에 없는 추가 기능이므로 아키텍처 점수에 미미한 영향.

### 3.3 Architecture Score

```
+-----------------------------------------------+
|  Architecture Compliance: 95%                  |
+-----------------------------------------------+
|  ✅ Correct layer placement: ~30 files         |
|  ⚠️ Dependency violations:   1 file           |
|  ❌ Wrong layer:              0 files          |
+-----------------------------------------------+
```

---

## 4. Convention Compliance

### 4.1 Naming Convention Check

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | - |
| Hooks | camelCase (use prefix) | 100% | - |
| Functions | camelCase | 100% | - |
| Constants | UPPER_SNAKE_CASE | 100% | STOCK_IN_REASONS, STOCK_OUT_REASONS |
| Types/Interfaces | PascalCase | 100% | ProductWithLots, CartItem, StudentWithSub |
| Files (component) | PascalCase.tsx | 100% | - |
| Files (hook) | use*.ts | 100% | - |
| Folders | kebab-case | 100% | - |
| UI text | Korean | 100% | - |
| Code identifiers | English | 100% | - |

### 4.2 Import Order Check

Sampled files show consistent pattern:
1. External libraries (react, next, lucide-react, tanstack)
2. Internal absolute imports (@/components/ui, @/lib/supabase)
3. Relative imports (../types, ./LotPickerDialog)
4. Type imports (import type)

Compliance: 100%

### 4.3 Environment Variables

| Variable | Convention | Status |
|----------|-----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | NEXT_PUBLIC_ prefix | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NEXT_PUBLIC_ prefix | ✅ |

### 4.4 Convention Score

```
+-----------------------------------------------+
|  Convention Compliance: 100%                   |
+-----------------------------------------------+
|  Naming:            100%                       |
|  Import Order:      100%                       |
|  Folder Structure:  100%                       |
|  Env Variables:     100%                       |
+-----------------------------------------------+
```

---

## 5. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 87% | ⚠️ |
| Architecture Compliance | 95% | ✅ |
| Convention Compliance | 100% | ✅ |
| **Overall** | **94%** | ✅ |

---

## 6. Differences Found

### 6.1 Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|---|------|-----------------|-------------|--------|
| 1 | ~~`PosClassTab.tsx`~~ | design.md:944 | ✅ 구현 완료 (2026-03-10) | — |
| 2 | ~~`SubscriptionBadge.tsx`~~ | design.md:737 | ✅ 구현 완료 (2026-03-10) | — |
| 3 | `PageHeader.tsx` | design.md:909 (Section 11.1) | 공유 페이지 헤더 미구현 (각 페이지 inline) | Low |
| 4 | `useCart.ts` | design.md:949 (Section 11.1) | 장바구니 훅 미구현 (useState로 대체) | Medium |
| 5 | ~~`store.ts` (Zustand)~~ | design.md:950 | ✅ 구현 완료 (2026-03-10) | — |
| 6 | `queries.ts` (inventory) | design.md:928 (Section 11.1) | 쿼리 분리 파일 미구현 (hooks에 inline) | Low |
| 7 | `queries.ts` (students) | design.md:939 (Section 11.1) | 쿼리 분리 파일 미구현 (hooks에 inline) | Low |

### 6.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description |
|---|------|------------------------|-------------|
| 1 | `ExcelImportDialog.tsx` | `src/features/inventory/components/` | 엑셀 일괄 업로드 기능 |
| 2 | `LotPickerDialog.tsx` | `src/features/pos/components/` | POS 로트 선택 다이얼로그 |
| 3 | `AttendanceHistory.tsx` | `src/features/students/components/` | 출석 이력 리스트 |
| 4 | `useShop.ts` | `src/features/inventory/hooks/` | shop 조회 훅 |
| 5 | `useProduct(id)` | `src/features/inventory/hooks/useProducts.ts` | 단일 상품 조회 |
| 6 | `useSale.ts` / `useSales.ts` | `src/features/pos/hooks/` | POS 결제 + 판매 내역 조회 |
| 7 | `useSettings.ts` | `src/features/settings/hooks/` | 공방 설정/비밀번호 변경 |
| 8 | `sales/page.tsx` | `src/app/(dashboard)/sales/` | 판매 내역 페이지 |
| 9 | `QueryProvider.tsx` | `src/components/shared/` | TanStack Query Provider |
| 10 | `utils.ts` | `src/features/inventory/` | 유틸 함수 |

### 6.3 Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | POS 상품 탭 이름 | `PosProductTab.tsx` | `ProductSearchPanel.tsx` | Low (동일 역할) |
| 2 | 상품 검색 입력 | `ProductSearchInput.tsx` (독립) | ProductSearchPanel 내부 + LotPickerDialog | Low (기능 분할) |
| 3 | 재고 hooks 구조 | useStockIn.ts, useStockOut.ts, useMovements.ts (3파일) | useLots.ts 1파일에 병합 | Low (export명 유지) |
| 4 | 장바구니 상태 관리 | Zustand store.ts | PosPage 내 useState | Medium (확장성 제한) |
| 5 | useAttendance 함수명 | useAttendance() | useAttend() | Low (사소한 차이) |
| 6 | 이력 조회 단위 | 로트별 getStockMovements(lotId) | 상품별 useProductMovements(productId) | Low (더 넓은 범위) |

---

## 7. Recommended Actions

### 7.1 Immediate Actions (High Impact)

| Priority | Item | Description |
|----------|------|-------------|
| 1 | PosClassTab 구현 | FR-11 수강료 탭은 설계의 핵심 기능. 수강생 검색 + 수강권 결제 UI 구현 필요 |

### 7.2 Design Document Update Needed

| Priority | Item | Description |
|----------|------|-------------|
| 1 | 추가된 컴포넌트 반영 | ExcelImportDialog, LotPickerDialog, AttendanceHistory, QueryProvider 추가 |
| 2 | 추가된 hooks 반영 | useShop, useProduct(id), useCheckout, useSales, useSettings 추가 |
| 3 | POS 상태 관리 결정 | Zustand store.ts vs useState 중 최종 결정 반영 |
| 4 | Hook 병합 구조 반영 | useStockIn/useStockOut/useMovements가 useLots.ts에 병합된 것 반영 |
| 5 | 판매 내역 페이지 추가 | /sales 경로 + useSales 반영 |
| 6 | queries.ts 제거 또는 구현 | hooks에 inline 쿼리가 현재 패턴이라면 설계에서 queries.ts 제거 |

### 7.3 Optional Improvements (Low Priority)

| Item | Description |
|------|-------------|
| SubscriptionBadge 구현 | 수강권 상태/잔여를 시각적으로 표시하는 뱃지 (현재 StudentCard 내부에서 처리 가능) |
| PageHeader 공통화 | 각 페이지에 반복되는 헤더 패턴을 공유 컴포넌트로 추출 |
| Zustand 도입 검토 | POS 장바구니가 복잡해질 경우 상태 관리 전환 필요 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-10 | Initial gap analysis | Claude (gap-detector) |
