'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, FileSpreadsheet, Package, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/features/inventory/components/ProductCard'
import { ProductForm } from '@/features/inventory/components/ProductForm'
import { ExcelImportDialog } from '@/features/inventory/components/ExcelImportDialog'
import { InventoryFilters } from '@/features/inventory/components/InventoryFilters'
import { ExcelExportButton } from '@/features/inventory/components/ExcelExportButton'
import { StocktakeDialog } from '@/features/inventory/components/StocktakeDialog'
import { useProducts, filterAndSortProducts } from '@/features/inventory/hooks/useProducts'
import { useShop } from '@/features/inventory/hooks/useShop'
import { getStockStatus } from '@/features/inventory/types'
import type { Product } from '@/types/database'
import type { InventoryFilterState } from '@/features/inventory/types'

const defaultFilters: InventoryFilterState = {
  brand: 'all',
  stockStatus: 'all',
  unit: 'all',
  sortBy: 'created_at',
  search: '',
}

export default function InventoryPage() {
  const { data: products, isLoading } = useProducts()
  const { data: shop } = useShop()
  const [filters, setFilters] = useState<InventoryFilterState>(defaultFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [stocktakeOpen, setStocktakeOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!products) return []
    return filterAndSortProducts(products, filters)
  }, [products, filters])

  // 동적 브랜드 목록
  const brands = useMemo(() => {
    if (!products) return []
    return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort()
  }, [products])

  // 부족 상품 카운트
  const lowStockCount = useMemo(() => {
    if (!products) return 0
    return products.filter((p) => getStockStatus(p) === 'low').length
  }, [products])

  const hasFilters = filters.brand !== 'all' || filters.stockStatus !== 'all' || filters.unit !== 'all' || filters.search.trim() !== ''

  function openCreate() {
    setEditProduct(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between px-6 h-[68px] border-b shrink-0">
        <div>
          <h1 className="text-xl font-semibold">재고 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products ? `${products.length}개 상품` : '상품을 로딩 중...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setStocktakeOpen(true)}>
            <ClipboardCheck size={14} />
            실사
          </Button>
          <ExcelExportButton products={filtered} />
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet size={14} />
            업로드
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            등록
          </Button>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="px-6 py-3 border-b shrink-0 flex flex-col sm:flex-row gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="상품명, 브랜드, 색상 검색..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <InventoryFilters
          filters={filters}
          onFiltersChange={setFilters}
          brands={brands}
          lowStockCount={lowStockCount}
          totalCount={products?.length ?? 0}
          filteredCount={filtered.length}
        />
      </div>

      {/* 상품 목록 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <Package size={32} className="opacity-30" />
            <p className="text-sm">
              {hasFilters ? '검색 결과가 없습니다' : '등록된 상품이 없습니다'}
            </p>
            {!hasFilters && (
              <Button variant="outline" size="sm" onClick={openCreate}>
                첫 상품 등록하기
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => openEdit(product)}
              />
            ))}
          </div>
        )}
      </div>

      {shop && (
        <>
          <ProductForm
            open={formOpen}
            onOpenChange={setFormOpen}
            shopId={shop.id}
            editProduct={editProduct}
          />
          <ExcelImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            shopId={shop.id}
          />
          <StocktakeDialog
            open={stocktakeOpen}
            onOpenChange={setStocktakeOpen}
            products={products ?? []}
          />
        </>
      )}
    </div>
  )
}
