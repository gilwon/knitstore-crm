import { create } from 'zustand'
import type { CartItem } from './types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (lotId: string, quantity: number) => void
  removeItem: (lotId: string) => void
  clear: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],

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
        return { items: state.items.filter((i) => i.lotId !== lotId) }
      }
      return {
        items: state.items.map((i) => (i.lotId === lotId ? { ...i, quantity } : i)),
      }
    }),

  removeItem: (lotId) =>
    set((state) => ({ items: state.items.filter((i) => i.lotId !== lotId) })),

  clear: () => set({ items: [] }),
}))
