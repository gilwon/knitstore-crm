'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ProductWithLots, InventoryFilterState } from '../types'
import { getStockStatus, getTotalStock } from '../types'

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*, lots(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as ProductWithLots
    },
    enabled: !!id,
  })
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*, lots(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as ProductWithLots[]
    },
  })
}

export function filterAndSortProducts(
  products: ProductWithLots[],
  filters: InventoryFilterState,
): ProductWithLots[] {
  let result = products

  // 검색
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.color_name.toLowerCase().includes(q) ||
      p.color_code.toLowerCase().includes(q)
    )
  }

  // 브랜드 필터
  if (filters.brand !== 'all') {
    result = result.filter((p) => p.brand === filters.brand)
  }

  // 재고 상태 필터
  if (filters.stockStatus !== 'all') {
    result = result.filter((p) => getStockStatus(p) === filters.stockStatus)
  }

  // 단위 필터
  if (filters.unit !== 'all') {
    result = result.filter((p) => p.unit === filters.unit)
  }

  // 정렬
  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name, 'ko')
      case 'stock':
        return getTotalStock(a) - getTotalStock(b)
      case 'price':
        return b.price - a.price
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  return result
}

interface CreateProductInput {
  shop_id: string
  brand: string
  name: string
  color_code: string
  color_name: string
  unit: 'ball' | 'g'
  price: number
  purchase_price: number
  alert_threshold: number
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: CreateProductInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('상품이 등록되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('상품 등록에 실패했습니다'),
  })
}

interface UpdateProductInput {
  id: string
  brand?: string
  name?: string
  color_code?: string
  color_name?: string
  unit?: 'ball' | 'g'
  price?: number
  purchase_price?: number
  alert_threshold?: number
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateProductInput) => {
      const supabase = createClient()
      const { error } = await supabase.from('products').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('상품이 수정되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('상품 수정에 실패했습니다'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('상품이 삭제되었습니다')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('상품 삭제에 실패했습니다'),
  })
}
