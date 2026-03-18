'use client'

import { useCartStore } from '../store'

export function useCart() {
  const items = useCartStore((s) => s.items)
  const itemDiscounts = useCartStore((s) => s.itemDiscounts)
  const orderDiscount = useCartStore((s) => s.orderDiscount)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const setItemDiscount = useCartStore((s) => s.setItemDiscount)
  const removeItemDiscount = useCartStore((s) => s.removeItemDiscount)
  const setOrderDiscount = useCartStore((s) => s.setOrderDiscount)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const clear = useCartStore((s) => s.clear)

  // 원래 소계 (할인 전)
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  // 품목별 할인 합계
  const itemDiscountTotal = items.reduce((sum, item) => {
    const discount = itemDiscounts[item.lotId]
    if (!discount) return sum
    const lineTotal = item.unitPrice * item.quantity
    if (discount.type === 'fixed') return sum + Math.min(discount.value, lineTotal)
    return sum + Math.round(lineTotal * (discount.value / 100))
  }, 0)

  // 전체 주문 할인
  const afterItemDiscount = subtotal - itemDiscountTotal
  const orderDiscountAmount = orderDiscount
    ? orderDiscount.type === 'fixed'
      ? Math.min(orderDiscount.value, afterItemDiscount)
      : Math.round(afterItemDiscount * (orderDiscount.value / 100))
    : 0

  const totalDiscount = itemDiscountTotal + orderDiscountAmount
  const grandTotal = Math.max(0, subtotal - totalDiscount)
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items,
    subtotal,
    itemDiscountTotal,
    orderDiscountAmount,
    totalDiscount,
    grandTotal,
    totalCount,
    paymentMethod,
    itemDiscounts,
    orderDiscount,
    addItem,
    updateQty,
    removeItem,
    setItemDiscount,
    removeItemDiscount,
    setOrderDiscount,
    setPaymentMethod,
    clear,
    // 하위 호환
    totalAmount: grandTotal,
  }
}
