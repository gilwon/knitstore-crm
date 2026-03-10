'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, FileSpreadsheet, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/features/inventory/components/ProductCard'
import { ProductForm } from '@/features/inventory/components/ProductForm'
import { ExcelImportDialog } from '@/features/inventory/components/ExcelImportDialog'
import { useProducts } from '@/features/inventory/hooks/useProducts'
import { useShop } from '@/features/inventory/hooks/useShop'
import type { Product } from '@/types/database'

export default function InventoryPage() {
  const { data: products, isLoading } = useProducts()
  const { data: shop } = useShop()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!products) return []
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.color_name.toLowerCase().includes(q) ||
      p.color_code.toLowerCase().includes(q)
    )
  }, [products, search])

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
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h1 className="text-xl font-semibold">재고 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products ? `${products.length}개 상품` : '상품을 로딩 중...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet size={14} />
            엑셀 업로드
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            상품 등록
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="px-6 py-3 border-b shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="상품명, 브랜드, 색상 검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
            <p className="text-sm">{search ? '검색 결과가 없습니다' : '등록된 상품이 없습니다'}</p>
            {!search && (
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
        <ProductForm
          open={formOpen}
          onOpenChange={setFormOpen}
          shopId={shop.id}
          editProduct={editProduct}
        />
      )}
      {shop && (
        <ExcelImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          shopId={shop.id}
        />
      )}
    </div>
  )
}
