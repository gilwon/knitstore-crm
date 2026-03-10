'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShop } from '@/features/inventory/hooks/useShop'
import { ProductSearchPanel } from '@/features/pos/components/ProductSearchPanel'
import { CartPanel } from '@/features/pos/components/CartPanel'
import { PosClassTab } from '@/features/pos/components/PosClassTab'
import type { CartItem } from '@/features/pos/types'

export default function PosPage() {
  const { data: shop } = useShop()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  function handleAdd(item: CartItem) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.lotId === item.lotId)
      if (existing) {
        return prev.map((i) =>
          i.lotId === item.lotId
            ? { ...i, quantity: Math.min(i.maxStock, i.quantity + item.quantity) }
            : i
        )
      }
      return [...prev, item]
    })
  }

  function handleUpdateQty(lotId: string, quantity: number) {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((i) => i.lotId !== lotId))
      return
    }
    setCartItems((prev) =>
      prev.map((i) => (i.lotId === lotId ? { ...i, quantity } : i))
    )
  }

  if (!shop) return null

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="px-6 py-4 border-b shrink-0">
        <h1 className="text-xl font-semibold">POS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">실 판매 또는 수강료를 결제합니다</p>
      </div>

      {/* 탭 전환 */}
      <div className="flex flex-1 min-h-0 flex-col">
        <Tabs defaultValue="product" className="flex flex-col flex-1 min-h-0">
          <div className="px-4 pt-3 shrink-0">
            <TabsList>
              <TabsTrigger value="product">실 판매</TabsTrigger>
              <TabsTrigger value="class">수강료</TabsTrigger>
            </TabsList>
          </div>

          {/* 실 판매 탭 */}
          <TabsContent value="product" className="flex-1 min-h-0 m-0">
            <div className="flex flex-1 min-h-0 h-full gap-4 p-4">
              {/* 좌: 상품 검색 */}
              <Card className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">상품 목록</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 overflow-hidden pt-3 flex flex-col">
                  <ProductSearchPanel onAdd={handleAdd} />
                </CardContent>
              </Card>

              {/* 우: 장바구니 */}
              <Card className="w-72 shrink-0 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-hidden pt-4 flex flex-col">
                  <CartPanel
                    shopId={shop.id}
                    items={cartItems}
                    onUpdateQty={handleUpdateQty}
                    onRemove={(lotId) =>
                      setCartItems((prev) => prev.filter((i) => i.lotId !== lotId))
                    }
                    onClear={() => setCartItems([])}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 수강료 탭 */}
          <TabsContent value="class" className="flex-1 min-h-0 m-0">
            <div className="flex flex-1 min-h-0 h-full gap-4 p-4">
              <Card className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">수강생 및 수강권</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 overflow-hidden pt-3 flex flex-col">
                  <PosClassTab shopId={shop.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
