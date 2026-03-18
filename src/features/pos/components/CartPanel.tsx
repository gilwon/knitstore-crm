'use client'

import { useState } from 'react'
import { Trash2, ShoppingCart, User, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCheckout } from '../hooks/useSale'
import { useCart } from '../hooks/useCart'
import { DiscountPopover } from './DiscountPopover'
import { OrderDiscountBar } from './OrderDiscountBar'
import { PaymentMethodSelector } from './PaymentMethodSelector'

interface CartPanelProps {
  shopId: string
}

export function CartPanel({ shopId }: CartPanelProps) {
  const [studentName, setStudentName] = useState('')
  const checkout = useCheckout()
  const {
    items, subtotal, itemDiscountTotal, orderDiscountAmount, totalDiscount,
    grandTotal, paymentMethod, itemDiscounts, orderDiscount,
    updateQty, removeItem, setItemDiscount, removeItemDiscount,
    setOrderDiscount, setPaymentMethod, clear,
  } = useCart()

  async function handleCheckout() {
    if (items.length === 0) return
    await checkout.mutateAsync({ shopId, items, studentId: null })
    clear()
    setStudentName('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <ShoppingCart size={15} className="text-muted-foreground" />
        <span className="font-semibold text-sm">장바구니</span>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">{items.length}종</Badge>
        )}
      </div>

      {/* 장바구니 항목 */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 px-0.5 py-0.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
            <ShoppingCart size={28} className="mb-2 opacity-20" />
            <p className="text-xs">상품을 선택해주세요</p>
          </div>
        ) : (
          items.map((item) => {
            const lineTotal = item.unitPrice * item.quantity
            const discount = itemDiscounts[item.lotId]
            const discountAmount = discount
              ? discount.type === 'fixed'
                ? Math.min(discount.value, lineTotal)
                : Math.round(lineTotal * (discount.value / 100))
              : 0

            return (
              <Card key={item.lotId}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {item.brand && (
                          <span className="text-muted-foreground font-normal text-xs">{item.brand} </span>
                        )}
                        {item.productName}
                      </p>
                      {item.colorName && (
                        <p className="text-xs text-muted-foreground">{item.colorName}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">{item.lotNumber}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <DiscountPopover
                        lotId={item.lotId}
                        lineTotal={lineTotal}
                        currentDiscount={discount}
                        onApply={setItemDiscount}
                        onRemove={() => removeItemDiscount(item.lotId)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.lotId)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQty(item.lotId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={11} />
                      </Button>
                      <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQty(item.lotId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus size={11} />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {item.unit === 'ball' ? '볼' : 'g'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">
                        {(lineTotal - discountAmount).toLocaleString()}원
                      </span>
                      {discountAmount > 0 && (
                        <span className="text-xs text-destructive block">
                          -{discountAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 결제 영역 */}
      {items.length > 0 && (
        <div className="pt-3 space-y-3 shrink-0">
          <Separator />

          {/* 전체 할인 */}
          <OrderDiscountBar
            subtotal={subtotal - itemDiscountTotal}
            orderDiscount={orderDiscount}
            onApply={setOrderDiscount}
          />

          {/* 결제 수단 */}
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          {/* 고객명 */}
          <div className="flex items-center gap-2">
            <User size={13} className="text-muted-foreground shrink-0" />
            <Input
              placeholder="고객명 (선택)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 금액 요약 */}
          <div className="space-y-1 px-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>소계</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-destructive">
                <span>할인</span>
                <span>-{totalDiscount.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-sm font-medium">총 결제금액</span>
              <span className="text-xl font-bold">{grandTotal.toLocaleString()}원</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="default"
            onClick={handleCheckout}
            disabled={checkout.isPending}
          >
            {checkout.isPending ? '처리 중...' : `${grandTotal.toLocaleString()}원 결제`}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={clear}
            disabled={checkout.isPending}
          >
            장바구니 비우기
          </Button>
        </div>
      )}
    </div>
  )
}
