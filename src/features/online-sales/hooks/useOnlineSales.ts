'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchOnlineSales,
  createOnlineSale,
  updateOnlineSale,
  deleteOnlineSale,
} from '../queries'
import type { OnlineSaleInsert, OnlineSaleUpdate } from '../types'

const KEYS = {
  all: ['onlineSales'] as const,
  list: (shopId: string, from?: string, to?: string) =>
    ['onlineSales', shopId, from, to] as const,
}

export function useOnlineSales(shopId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: KEYS.list(shopId, from, to),
    queryFn: () => fetchOnlineSales(shopId, from, to),
    enabled: !!shopId,
  })
}

export function useCreateOnlineSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: OnlineSaleInsert) => createOnlineSale(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('판매가 등록되었습니다')
    },
    onError: () => {
      toast.error('판매 등록에 실패했습니다')
    },
  })
}

export function useUpdateOnlineSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OnlineSaleUpdate }) =>
      updateOnlineSale(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('판매가 수정되었습니다')
    },
    onError: () => {
      toast.error('판매 수정에 실패했습니다')
    },
  })
}

export function useDeleteOnlineSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOnlineSale(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('판매가 삭제되었습니다')
    },
    onError: () => {
      toast.error('판매 삭제에 실패했습니다')
    },
  })
}
