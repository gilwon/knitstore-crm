import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, PaymentMethod, ItemDiscount, OrderDiscount } from './types'

interface CartStore {
  items: CartItem[]
  itemDiscounts: Record<string, ItemDiscount>  // keyed by lotId
  orderDiscount: OrderDiscount | null
  paymentMethod: PaymentMethod
  addItem: (item: CartItem) => void
  updateQty: (lotId: string, quantity: number) => void
  removeItem: (lotId: string) => void
  setItemDiscount: (discount: ItemDiscount) => void
  removeItemDiscount: (lotId: string) => void
  setOrderDiscount: (discount: OrderDiscount | null) => void
  setPaymentMethod: (method: PaymentMethod) => void
  clear: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      itemDiscounts: {},
      orderDiscount: null,
      paymentMethod: 'card',

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.lotId === item.lotId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lotId === item.lotId
                  ? { ...i, quantity: Math.min(i.maxStock, i.quantity + item.quantity) }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),

      updateQty: (lotId, quantity) =>
        set((state) => {
          if (quantity < 1) {
            const { [lotId]: _, ...rest } = state.itemDiscounts
            return {
              items: state.items.filter((i) => i.lotId !== lotId),
              itemDiscounts: rest,
            }
          }
          return {
            items: state.items.map((i) => (i.lotId === lotId ? { ...i, quantity } : i)),
          }
        }),

      removeItem: (lotId) =>
        set((state) => {
          const { [lotId]: _, ...rest } = state.itemDiscounts
          return {
            items: state.items.filter((i) => i.lotId !== lotId),
            itemDiscounts: rest,
          }
        }),

      setItemDiscount: (discount) =>
        set((state) => ({
          itemDiscounts: { ...state.itemDiscounts, [discount.lotId]: discount },
        })),

      removeItemDiscount: (lotId) =>
        set((state) => {
          const { [lotId]: _, ...rest } = state.itemDiscounts
          return { itemDiscounts: rest }
        }),

      setOrderDiscount: (discount) => set({ orderDiscount: discount }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      clear: () => set({
        items: [],
        itemDiscounts: {},
        orderDiscount: null,
        paymentMethod: 'card',
      }),
    }),
    { name: 'pos-cart-v1' }
  )
)
