# Gap Detector Memory - KnitStore CRM

## Project Structure
- **Type**: Next.js App Router + Supabase + TanStack Query + shadcn/ui
- **Architecture Level**: Dynamic (features/, hooks/, types/, lib/)
- **Design Doc**: `docs/02-design/features/knitstore-crm.design.md`
- **DB Types**: `src/types/database.ts` (manual, mirrors Supabase schema)

## Feature Layout Pattern
```
src/features/{feature}/
  components/   (Presentation)
  hooks/        (Application)
  types.ts      (Domain)
```

## Key Conventions Confirmed
- Components: PascalCase files, camelCase hooks with `use` prefix
- Constants: UPPER_SNAKE_CASE (e.g., STOCK_IN_REASONS)
- Korean UI text, English code identifiers
- Import order: external -> @/ absolute -> relative -> type imports
- Infrastructure access: hooks call supabase, components call hooks (never direct supabase)

## Full Project Analysis (2026-03-10)
- **Overall Match Rate: 82% (39/51 design items matched)**
- Architecture: 95% | Convention: 100% | Overall: 87%
- Report: `docs/03-analysis/knitstore-crm.analysis.md`

### Key Gaps
- **FR-11 PosClassTab**: Only missing functional requirement (수강료 탭)
- **POS state**: Design says Zustand store.ts, impl uses useState in PosPage
- **queries.ts**: Design specifies 2 files (inventory, students), neither exists (inline in hooks)
- **SubscriptionBadge, PageHeader**: Missing low-priority UI components
- Hook merge: useStockIn/useStockOut/useMovements all in useLots.ts (not separate files)
- Renamed: PosProductTab -> ProductSearchPanel, ProductSearchInput -> LotPickerDialog
- useAttendance -> useAttend (minor naming diff)

### Added (not in design)
- ExcelImportDialog, LotPickerDialog, AttendanceHistory, QueryProvider
- useShop, useProduct(id), useCheckout, useSales, useSettings
- /sales page, inventory/utils.ts, settings feature

### Confirmed Patterns
- Hook merge: useStockIn + useStockOut + useProductMovements all in useLots.ts
- Movement query: per-product (broader than design's per-lot)
- checkLotMix: impl uses (lots: Lot[], qty) not (productId, qty)
- ExcelImportDialog: direct supabase access from component (minor arch violation)

## Auth/Supabase Analysis (2026-03-10)
- **v0.1: 81% (25/31) -> v0.2: 100% (31/31)**
- Architecture: 100% | Convention: 100%
- Report: `docs/03-analysis/supabase.analysis.md`

### All Issues Resolved (v0.2)
- Middleware: `src/proxy.ts` deleted, `src/middleware.ts` created with correct export
- Redirect: all 3 locations unified to `/dashboard` (middleware, useSignIn, page.tsx)
- Auth layout: `bg-slate-50` -> `bg-background` (dark mode supported)
- `.env.example`: created with 2 env vars

### Remaining Doc-Only Gap
- Design doc Section 11.1 still says `redirect to /inventory` -- needs update to `/dashboard`
- Design doc missing `/dashboard` page in Screen Map (Section 5.1)
