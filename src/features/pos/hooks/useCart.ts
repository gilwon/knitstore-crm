'use client'

import { useCartStore } from '../store'
import type { CartItem } from '../types'

export function useCart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return { items, totalAmount, totalCount, addItem, updateQty, removeItem, clear }
}
