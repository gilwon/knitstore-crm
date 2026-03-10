'use client'

import { useState } from 'react'
import { Search, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useProducts } from '@/features/inventory/hooks/useProducts'
import type { ProductWithLots } from '@/features/inventory/types'
import type { CartItem } from '../types'
import { LotPickerDialog } from './LotPickerDialog'

interface ProductSearchPanelProps {
  onAdd: (item: CartItem) => void
}

export function ProductSearchPanel({ onAdd }: ProductSearchPanelProps) {
  const [search, setSearch] = useState('')
  const [pickerTarget, setPickerTarget] = useState<ProductWithLots | null>(null)
  const { data: products = [], isLoading } = useProducts()

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.color_name.toLowerCase().includes(q) ||
      p.color_code.toLowerCase().includes(q)
    )
  })

  function handleProductClick(product: ProductWithLots) {
    if (product.lots.filter((l) => l.stock_quantity > 0).length === 0) return
    setPickerTarget(product)
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 검색 */}
      <div className="relative shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="상품명, 브랜드, 색상 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 상품 목록 */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pl-0.5 pr-1 py-0.5">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">검색 결과가 없습니다</div>
        ) : (
          filtered.map((product) => {
            const totalStock = product.lots.reduce((s, l) => s + l.stock_quantity, 0)
            const hasStock = totalStock > 0
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleProductClick(product)}
                disabled={!hasStock}
                className="w-full text-left"
              >
                <Card className={`transition-colors ${hasStock ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <CardContent className="py-2.5 px-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        )}
                        <span className="text-sm font-medium">{product.name}</span>
                        {product.color_name && (
                          <span className="text-xs text-muted-foreground">{product.color_code} {product.color_name}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-0.5">
                        {product.price.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">
                          원 / {product.unit === 'ball' ? '볼' : 'g'}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0">
                      {hasStock ? (
                        <Badge variant="outline" className="text-xs">
                          <Package size={10} className="mr-1" />
                          {totalStock}{product.unit === 'ball' ? '볼' : 'g'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">품절</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })
        )}
      </div>

      <LotPickerDialog
        product={pickerTarget}
        onAdd={onAdd}
        onClose={() => setPickerTarget(null)}
      />
    </div>
  )
}
