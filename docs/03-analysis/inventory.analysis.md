# Inventory Feature Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation) -- Re-analysis v0.2
>
> **Project**: KnitStore CRM
> **Version**: 0.1.0
> **Analyst**: gap-detector
> **Date**: 2026-03-09
> **Design Doc**: [knitstore-crm.design.md](../02-design/features/knitstore-crm.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Re-analysis after Act phase implementation. Previous analysis (v0.1) found 75% match rate (27/36 items). Nine items were implemented to close gaps. This report verifies the fixes and recalculates the overall match rate.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/knitstore-crm.design.md`
- **Implementation Path**: `src/features/inventory/`, `src/app/(dashboard)/inventory/`, `src/types/database.ts`
- **Analysis Date**: 2026-03-09
- **Previous Analysis**: v0.1 (2026-03-09) -- 75% match rate

### 1.3 Changes Since v0.1

| # | Item Implemented | File |
|---|-----------------|------|
| 1 | `MovementHistory` component | `src/features/inventory/components/MovementHistory.tsx` |
| 2 | `LotMixWarning` dialog | `src/features/inventory/components/LotMixWarning.tsx` |
| 3 | `useProductMovements(productId)` hook | `src/features/inventory/hooks/useLots.ts` |
| 4 | `MovementWithLot` type | `src/features/inventory/hooks/useLots.ts` |
| 5 | `checkLotMix(lots, qty)` utility | `src/features/inventory/utils.ts` |
| 6 | `/inventory/[productId]` detail page | `src/app/(dashboard)/inventory/[productId]/page.tsx` |
| 7 | INSUFFICIENT_STOCK current stock parsing | `src/features/inventory/hooks/useLots.ts:83-86` |
| 8 | `useProduct(id)` hook | `src/features/inventory/hooks/useProducts.ts` |
| 9 | Detail page link in ProductCard | `src/features/inventory/components/ProductCard.tsx:51-55` |

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API / Query Operations (Section 4.1)

| Design Operation | Implementation | Status | Notes |
|-----------------|----------------|:------:|-------|
| `getProducts(shopId)` | `useProducts()` in hooks/useProducts.ts | ✅ | No shopId filter -- relies on RLS |
| `createProduct(data)` | `useCreateProduct()` in hooks/useProducts.ts | ✅ | |
| `updateProduct(id, data)` | `useUpdateProduct()` in hooks/useProducts.ts | ✅ | |
| `deleteProduct(id)` | `useDeleteProduct()` in hooks/useProducts.ts | ✅ | |
| `getLotsByProduct(productId)` | Nested in `useProducts()` via `.select('*, lots(*)')` | ✅ | Inline join, not separate query |
| `createLot(data)` | Inline in `useStockIn()` (useLots.ts:23-39) | ✅ | Combined with stock-in flow |
| `processStockIn(lotId, qty, reason, memo)` | `useStockIn()` via `supabase.rpc('process_stock_in')` | ✅ | |
| `processStockOut(lotId, qty, reason, memo)` | `useStockOut()` via `supabase.rpc('process_stock_out')` | ✅ | |
| `getStockMovements(lotId)` | `useProductMovements(productId)` in useLots.ts:94-117 | ✅ | Queries by productId (all lots), not single lotId -- functionally broader |
| `checkLotMix(productId, qty)` | `checkLotMix(lots, qty)` in utils.ts | ✅ | Signature differs: takes `Lot[]` instead of `productId` -- caller provides lots |

**API Match**: 10/10 = **100%** (was 80%)

### 2.2 Data Model (Section 3.1)

| Entity | Design | database.ts Types | Status | Notes |
|--------|--------|-------------------|:------:|-------|
| Shop | id, name, owner_id, created_at | Row match | ✅ | |
| Product | All 10 fields | Row match | ✅ | |
| Lot | id, product_id, lot_number, stock_quantity, created_at, updated_at | Row match | ✅ | |
| StockMovement | id, lot_id, type, quantity, reason, memo, sale_item_id, created_at | Row match | ✅ | |
| Student | All fields | Row match | ✅ | Types prepared (not in inventory scope) |
| Subscription | All fields | Row match | ✅ | Types prepared (not in inventory scope) |
| Attendance | All fields | Row match | ✅ | Types prepared (not in inventory scope) |
| Sale | All fields | Row match | ✅ | Types prepared (not in inventory scope) |
| SaleItem | All fields | Row match | ✅ | Types prepared (not in inventory scope) |

**Data Model Match**: 9/9 = **100%** (unchanged)

### 2.3 Component Structure (Section 5.3 - Inventory Only)

| Design Component | Implementation File | Status | Notes |
|-----------------|---------------------|:------:|-------|
| `ProductCard` | `features/inventory/components/ProductCard.tsx` | ✅ | Now includes detail page link (`ExternalLink` button) |
| `LotBadge` | `features/inventory/components/LotBadge.tsx` | ✅ | |
| `StockInSheet` | `features/inventory/components/StockInSheet.tsx` | ✅ | |
| `StockOutSheet` | `features/inventory/components/StockOutSheet.tsx` | ✅ | |
| `MovementHistory` | `features/inventory/components/MovementHistory.tsx` | ✅ | **NEW** -- Table with date, lot, type badge, reason, quantity, memo |
| `LotMixWarning` | `features/inventory/components/LotMixWarning.tsx` | ✅ | **NEW** -- Dialog with active lot listing + confirm/cancel |
| `ProductForm` (Section 11.1) | `features/inventory/components/ProductForm.tsx` | ✅ | In design file structure, not component list |

**Component Match**: 7/7 = **100%** (was 71%)

### 2.4 Hooks / Application Layer (Section 9.2)

| Design Hook | Implementation | Status | Notes |
|-------------|----------------|:------:|-------|
| `useProducts` | `hooks/useProducts.ts` (query + 3 mutations) | ✅ | |
| `useLots` | Lot query inline in useProducts via `select('*, lots(*)')` | ⚠️ | No standalone useLots query hook (unchanged) |
| `useStockIn` | `hooks/useLots.ts` exports `useStockIn` | ✅ | Design says separate file; impl merged |
| `useStockOut` | `hooks/useLots.ts` exports `useStockOut` | ✅ | Design says separate file; impl merged |
| `useMovements` | `useProductMovements(productId)` in hooks/useLots.ts:94-117 | ✅ | **NEW** -- Named differently but functionally equivalent |
| `useShop` (not in design) | `hooks/useShop.ts` | ⚠️ | Added in implementation |
| `useProduct` (not in design) | `hooks/useProducts.ts:8-23` | ⚠️ | **NEW** -- Single product query for detail page |

**Hook Match**: 4/5 designed hooks implemented = **80%** (was 60%)

Note: `useLots` remains a partial match -- lot data is fetched inline via `useProducts`/`useProduct` joins rather than as a standalone hook. This is a structural choice, not a functional gap.

### 2.5 Page / Route (Section 5.1)

| Design Route | Implementation | Status | Notes |
|-------------|----------------|:------:|-------|
| `/inventory` (main) | `src/app/(dashboard)/inventory/page.tsx` | ✅ | |
| `/inventory/[productId]` (detail) | `src/app/(dashboard)/inventory/[productId]/page.tsx` | ✅ | **NEW** -- Tabs: lots + movement history |

**Route Match**: 2/2 = **100%** (was 50%)

### 2.6 Error Handling (Section 6.1 - Inventory Only)

| Error Code | Handling Required | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| `INSUFFICIENT_STOCK` | toast error + show current stock | `useLots.ts:83-86` parses `현재고(\d+)` from error, shows "재고가 부족합니다 (현재고: N)" | ✅ | **FIXED** |
| `LOT_MIX_WARNING` | Confirm dialog (continue/cancel) | `LotMixWarning.tsx` dialog with active lot listing + confirm/cancel. Used in `[productId]/page.tsx:56-69` | ✅ | **FIXED** |
| `DUPLICATE_LOT` | toast error + guide to existing lot | `useLots.ts:36` shows toast "이미 존재하는 로트 번호입니다" but does NOT guide user to stock-in on existing lot | ⚠️ | Toast shown, guidance missing |

**Error Handling Match**: 2.5/3 = **83%** (was 33%)

### 2.7 Match Rate Summary

```
+---------------------------------------------+
|  Category             Items   Match   Rate   |
+---------------------------------------------+
|  API Operations       10      10      100%   |
|  Data Model            9       9      100%   |
|  Components            7       7      100%   |
|  Hooks                 5       4       80%   |
|  Routes                2       2      100%   |
|  Error Handling        3       2.5     83%   |
+---------------------------------------------+
|  TOTAL                36      34.5     96%   |
+---------------------------------------------+
```

---

## 3. Differences Found

### 3.1 Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Severity |
|---|------|-----------------|-------------|----------|
| 1 | `DUPLICATE_LOT` existing lot guidance | Section 6.1 | Toast does not guide user to stock-in on the existing lot (only shows error message) | Low |
| 2 | Standalone `useLots` query hook | Section 9.2 / 11.1 | Lot data fetched inline via product joins, not standalone hook | Low |

### 3.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description |
|---|------|------------------------|-------------|
| 1 | `useShop` hook | `features/inventory/hooks/useShop.ts` | Shop query hook -- not in design Section 9.2 but logically required |
| 2 | `useProduct(id)` hook | `features/inventory/hooks/useProducts.ts:8-23` | Single product query for detail page |
| 3 | `ProductForm` in component list | `features/inventory/components/ProductForm.tsx` | Listed in file structure (11.1) but missing from component table (5.3) |
| 4 | Product search/filter | `app/(dashboard)/inventory/page.tsx:20-30` | Client-side search by name/brand/color -- not explicitly designed |
| 5 | `MovementWithLot` type | `features/inventory/hooks/useLots.ts:8` | Extended type for movement history display |
| 6 | `checkLotMix` return type `LotMixCheck` | `features/inventory/utils.ts:3-6` | Interface for lot mix check result |
| 7 | Detail page link in ProductCard | `features/inventory/components/ProductCard.tsx:51-55` | ExternalLink button linking to `/inventory/[productId]` |

### 3.3 Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | Hook file structure | Separate files: `useStockIn.ts`, `useStockOut.ts`, `useMovements.ts` | Merged into `useLots.ts` | Low -- functional equivalence |
| 2 | Lot query | Standalone `getLotsByProduct` | Nested join in `useProducts` via `select('*, lots(*)')` | Low -- simpler, fewer network calls |
| 3 | Shop query | Implicit (assumed from auth context) | Explicit `useShop` hook fetching shop by owner_id | Low -- practical addition |
| 4 | StockInSheet layout | Bottom Sheet (design mockup) | Right-side Sheet (`side="right"`) | Low -- UI direction difference |
| 5 | `checkLotMix` signature | `checkLotMix(productId, qty)` | `checkLotMix(lots: Lot[], qty)` | Low -- caller provides lots array instead of fetching internally |
| 6 | Movement query scope | `getStockMovements(lotId)` per single lot | `useProductMovements(productId)` across all lots | Low -- broader query, better for product detail page |

---

## 4. Clean Architecture Compliance (Section 9)

### 4.1 Layer Assignment Verification

| Component | Designed Layer | Actual Location | Status |
|-----------|---------------|-----------------|:------:|
| ProductCard, LotBadge, StockInSheet, StockOutSheet, ProductForm, MovementHistory, LotMixWarning | Presentation | `src/features/inventory/components/` | ✅ |
| useProducts, useProduct, useStockIn, useStockOut, useProductMovements, useShop | Application | `src/features/inventory/hooks/` | ✅ |
| ProductWithLots, STOCK_IN/OUT_REASONS | Domain | `src/features/inventory/types.ts` | ✅ |
| checkLotMix, LotMixCheck | Domain | `src/features/inventory/utils.ts` | ✅ |
| Product, Lot, StockMovement types | Domain | `src/types/database.ts` | ✅ |
| Supabase Client | Infrastructure | `src/lib/supabase/client.ts` | ✅ |

### 4.2 Dependency Direction Check

| Source File | Layer | Imports From | Target Layer | Status |
|-------------|-------|-------------|--------------|:------:|
| `ProductCard.tsx` | Presentation | `../hooks/useProducts` | Application | ✅ |
| `ProductCard.tsx` | Presentation | `@/types/database` | Domain | ✅ |
| `StockInSheet.tsx` | Presentation | `../hooks/useLots` | Application | ✅ |
| `StockInSheet.tsx` | Presentation | `@/types/database` | Domain | ✅ |
| `StockOutSheet.tsx` | Presentation | `../hooks/useLots` | Application | ✅ |
| `ProductForm.tsx` | Presentation | `../hooks/useProducts` | Application | ✅ |
| `MovementHistory.tsx` | Presentation | `../hooks/useLots` | Application | ✅ |
| `LotMixWarning.tsx` | Presentation | `@/types/database` | Domain | ✅ |
| `[productId]/page.tsx` | Presentation | `@/features/inventory/hooks/*` | Application | ✅ |
| `[productId]/page.tsx` | Presentation | `@/features/inventory/utils` | Domain | ✅ |
| `[productId]/page.tsx` | Presentation | `@/features/inventory/components/*` | Presentation | ✅ |
| `useProducts.ts` | Application | `@/lib/supabase/client` | Infrastructure | ✅ |
| `useLots.ts` | Application | `@/lib/supabase/client` | Infrastructure | ✅ |
| `useShop.ts` | Application | `@/lib/supabase/client` | Infrastructure | ✅ |
| `LotBadge.tsx` | Presentation | `@/lib/utils` | Infrastructure | ⚠️ |
| `page.tsx` (inventory) | Presentation | `@/features/inventory/hooks/*` | Application | ✅ |

**Violations**: 1 minor -- `LotBadge.tsx` imports `cn()` from `@/lib/utils` (Infrastructure). Common utility exception, acceptable.

### 4.3 Architecture Score

```
+---------------------------------------------+
|  Architecture Compliance: 95%                |
+---------------------------------------------+
|  Correct layer placement: 17/17 files        |
|  Dependency violations:   0 (critical)       |
|  Minor exceptions:        1 (cn utility)     |
+---------------------------------------------+
```

---

## 5. Convention Compliance (Section 10)

### 5.1 Naming Convention Check

| Category | Convention | Checked | Compliance | Violations |
|----------|-----------|:-------:|:----------:|------------|
| Components | PascalCase | 7 | 100% | -- |
| Hooks | camelCase + use prefix | 8 | 100% | -- |
| Constants | UPPER_SNAKE_CASE | 3 | 100% | `STOCK_IN_REASONS`, `STOCK_OUT_REASONS`, `REASON_LABELS` |
| Types | PascalCase | 5 | 100% | `ProductWithLots`, `MovementWithLot`, `LotMixCheck`, `FormValues`, `CreateProductInput` |
| Files (component) | PascalCase.tsx | 7 | 100% | -- |
| Files (hook) | camelCase.ts | 3 | 100% | -- |
| Files (utility) | camelCase.ts | 1 | 100% | `utils.ts` |
| Folders | kebab-case | 3 | 100% | `inventory/`, `components/`, `hooks/` |

### 5.2 Import Order Check

Checked all 13 implementation files:
- [x] External libraries first (`react`, `next/link`, `react-hook-form`, `zod`, `@tanstack/react-query`, `lucide-react`, `sonner`)
- [x] Internal absolute imports second (`@/components/ui/*`, `@/lib/*`, `@/types/*`, `@/features/*`)
- [x] Relative imports third (`../hooks/*`, `../types`, `./LotBadge`)
- [x] Type imports last (`import type`)

No violations found.

### 5.3 Language Convention Check (Section 10.2)

| Area | Convention | Status | Notes |
|------|-----------|:------:|-------|
| Code identifiers | English | ✅ | `stockQuantity`, `ProductCard`, `checkLotMix`, etc. |
| UI text | Korean | ✅ | "입고 등록", "재고 부족", "로트 혼합 경고" |
| Comments | Korean allowed | ✅ | `// 새 로트 생성`, `// 로트 혼합 여부 확인` |

### 5.4 Convention Score

```
+---------------------------------------------+
|  Convention Compliance: 100%                 |
+---------------------------------------------+
|  Naming:           100%                      |
|  Import Order:     100%                      |
|  Language:         100%                      |
|  Folder Structure: 100%                      |
+---------------------------------------------+
```

---

## 6. Overall Scores

| Category | Score | Status | Change from v0.1 |
|----------|:-----:|:------:|:-----------------:|
| Design Match (API + Components + Hooks + Routes + Errors) | 96% | ✅ | +21pp (was 75%) |
| Data Model Match | 100% | ✅ | -- (unchanged) |
| Architecture Compliance | 95% | ✅ | -- (unchanged) |
| Convention Compliance | 100% | ✅ | -- (unchanged) |
| **Overall** | **96%** | **✅** | **+21pp** |

---

## 7. v0.1 Gap Resolution Tracker

| # | v0.1 Gap Item | Resolution | Status |
|---|---------------|-----------|:------:|
| 1 | `MovementHistory` component missing | Created `MovementHistory.tsx` with table, badges, reason labels | ✅ Resolved |
| 2 | `LotMixWarning` dialog missing | Created `LotMixWarning.tsx` with active lot list + confirm/cancel | ✅ Resolved |
| 3 | `getStockMovements(lotId)` API missing | Implemented as `useProductMovements(productId)` -- broader scope | ✅ Resolved |
| 4 | `checkLotMix(productId, qty)` logic missing | Implemented in `utils.ts` as `checkLotMix(lots, qty)` | ✅ Resolved |
| 5 | `useMovements` hook missing | Implemented as `useProductMovements` in `useLots.ts` | ✅ Resolved |
| 6 | `/inventory/[productId]` route missing | Created detail page with tabs (lots/history) + lot mix check | ✅ Resolved |
| 7 | INSUFFICIENT_STOCK no current stock display | Now parses `현재고(\d+)` and shows in toast | ✅ Resolved |
| 8 | DUPLICATE_LOT no existing lot guidance | Toast shows error message but still does not guide to existing lot | ⚠️ Partial |

**Resolution Rate**: 7/8 fully resolved, 1/8 partial = **94%**

---

## 8. Remaining Gaps

### 8.1 DUPLICATE_LOT Guidance (Low Priority)

**Design** (Section 6.1): `DUPLICATE_LOT` -- toast error + guide to existing lot for stock-in.

**Implementation** (`useLots.ts:36`):
```typescript
if (lotError.code === '23505') throw new Error('이미 존재하는 로트 번호입니다')
```

**Gap**: The error message informs the user that the lot already exists but does not provide guidance to select the existing lot and perform stock-in on it. A possible improvement would be to show the existing lot with a "입고하기" action in the toast or automatically select the existing lot in the StockInSheet.

**Impact**: Low -- users can manually select the existing lot from the dropdown.

### 8.2 Standalone useLots Hook (Low Priority)

**Design** (Section 9.2 / 11.1): Separate `useLots` hook file.

**Implementation**: Lot data is fetched as part of product queries via `select('*, lots(*)')`. No standalone `useLots` query hook exists.

**Impact**: Low -- functional equivalence achieved through inline joins. Separate hook would only be needed if lot data is required independently of products.

---

## 9. Recommended Actions

### 9.1 Optional Improvements (non-blocking)

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| Low | DUPLICATE_LOT: Add guidance to select existing lot in StockInSheet | Small | UX polish |
| Low | Extract standalone `useLots` hook if needed for POS feature | Small | Code organization |

### 9.2 Design Document Updates Needed

| Item | Section | Action |
|------|---------|--------|
| Add `ProductForm` to component list | 5.3 | Add row for ProductForm |
| Add `useShop` to hook list | 9.2 | Add row for useShop |
| Add `useProduct(id)` to hook list | 9.2 | Add row for useProduct |
| Note product search/filter feature | 5.2 | Add search bar to layout description |
| Update hook file organization | 11.1 | Merge `useStockIn.ts`/`useStockOut.ts`/`useMovements.ts` into `useLots.ts` |
| Update `checkLotMix` signature | 4.1 | Change to `checkLotMix(lots: Lot[], qty)` |
| Update `getStockMovements` scope | 4.1 | Change to `getProductMovements(productId)` |

### 9.3 Synchronization Recommendation

Match rate is 96% (above 90% threshold). The design and implementation align well.

> "Design and implementation match well. Two minor gaps remain (DUPLICATE_LOT guidance, standalone useLots hook) but neither blocks functionality. Design document updates are recommended to reflect implementation choices."

---

## 10. Next Steps

- [x] ~~Implement MovementHistory, LotMixWarning, product detail page~~ (Done)
- [x] ~~Improve INSUFFICIENT_STOCK error handling~~ (Done)
- [ ] (Optional) Improve DUPLICATE_LOT guidance
- [ ] Update design document with added features and signature changes
- [ ] Generate completion report: `/pdca report inventory`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-09 | Initial analysis -- 75% match rate | gap-detector |
| 0.2 | 2026-03-09 | Re-analysis after Act phase -- 96% match rate | gap-detector |
