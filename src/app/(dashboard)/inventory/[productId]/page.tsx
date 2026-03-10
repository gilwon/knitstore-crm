'use client'

import { useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, TrendingUp, Layers, Tag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LotBadge } from '@/features/inventory/components/LotBadge'
import { StockInSheet } from '@/features/inventory/components/StockInSheet'
import { StockOutSheet } from '@/features/inventory/components/StockOutSheet'
import { MovementHistory } from '@/features/inventory/components/MovementHistory'
import { LotMixWarning } from '@/features/inventory/components/LotMixWarning'
import { useProduct } from '@/features/inventory/hooks/useProducts'
import { checkLotMix } from '@/features/inventory/utils'

interface PageProps {
  params: Promise<{ productId: string }>
}

export default function ProductDetailPage({ params }: PageProps) {
  const { productId } = use(params)
  const { data: product, isLoading } = useProduct(productId)

  const [stockInOpen, setStockInOpen] = useState(false)
  const [stockOutOpen, setStockOutOpen] = useState(false)
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [lotMixOpen, setLotMixOpen] = useState(false)
  const [pendingStockOut, setPendingStockOut] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Package className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">상품을 찾을 수 없습니다.</p>
        <Link href="/inventory">
          <Button variant="outline" size="sm">목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const lots = product.lots ?? []
  const totalStock = lots.reduce((sum, l) => sum + l.stock_quantity, 0)
  const unitLabel = product.unit === 'ball' ? '볼' : 'g'

  function handleStockOutClick(lotId?: string) {
    if (lotId) {
      setSelectedLotId(lotId)
    } else {
      const { hasMix } = checkLotMix(lots, 1)
      if (hasMix) {
        setPendingStockOut(true)
        setLotMixOpen(true)
        return
      }
    }
    setStockOutOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Link href="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold leading-tight">
            {product.brand && (
              <span className="text-muted-foreground font-normal text-base mr-1.5">{product.brand}</span>
            )}
            {product.name}
          </h1>
          {(product.color_code || product.color_name) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[product.color_code, product.color_name].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => { setSelectedLotId(''); setStockInOpen(true) }}>
            입고
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStockOutClick()}>
            출고
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp size={14} />
                  <span className="text-xs">총 재고</span>
                </div>
                <p className="text-2xl font-bold">
                  {totalStock}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{unitLabel}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Layers size={14} />
                  <span className="text-xs">로트 수</span>
                </div>
                <p className="text-2xl font-bold">
                  {lots.length}
                  <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Tag size={14} />
                  <span className="text-xs">구매 단가</span>
                </div>
                <p className="text-lg font-bold">
                  {(product.purchase_price ?? 0).toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Tag size={14} />
                  <span className="text-xs">판매 단가</span>
                </div>
                <p className="text-lg font-bold">
                  {product.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 탭 */}
          <Tabs defaultValue="lots">
            <TabsList className="w-full">
              <TabsTrigger value="lots" className="flex-1">로트 현황</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">입출고 이력</TabsTrigger>
            </TabsList>

            <TabsContent value="lots" className="mt-4 space-y-2">
              {lots.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    등록된 로트가 없습니다.
                  </CardContent>
                </Card>
              ) : (
                lots.map((lot) => (
                  <Card key={lot.id}>
                    <CardContent className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <LotBadge lot={lot} alertThreshold={product.alert_threshold} unit={product.unit} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(lot.created_at).toLocaleDateString('ko-KR')} 등록
                        </span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => { setSelectedLotId(lot.id); setStockInOpen(true) }}>
                          입고
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={lot.stock_quantity === 0}
                          onClick={() => handleStockOutClick(lot.id)}
                        >
                          출고
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-muted-foreground"
                onClick={() => { setSelectedLotId('__new__'); setStockInOpen(true) }}
              >
                + 새 로트 입고
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <MovementHistory productId={productId} unit={product.unit} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 시트 / 다이얼로그 */}
      <StockInSheet
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        product={product}
        lots={lots}
        defaultLotId={selectedLotId}
      />
      <StockOutSheet
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        product={product}
        lots={lots}
        defaultLotId={selectedLotId}
      />
      <LotMixWarning
        open={lotMixOpen}
        activeLots={lots.filter((l) => l.stock_quantity > 0)}
        requestedQty={1}
        unit={product.unit}
        onConfirm={() => {
          setLotMixOpen(false)
          if (pendingStockOut) { setPendingStockOut(false); setStockOutOpen(true) }
        }}
        onCancel={() => { setLotMixOpen(false); setPendingStockOut(false) }}
      />
    </div>
  )
}
