'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchPackagingTemplates,
  createPackagingTemplate,
  updatePackagingTemplate,
  deletePackagingTemplate,
} from '../queries'
import type { PackagingTemplateInsert, PackagingTemplateUpdate } from '../types'

const KEYS = {
  all: ['packagingTemplates'] as const,
  list: (shopId: string, type?: string) => ['packagingTemplates', shopId, type] as const,
}

export function usePackagingTemplates(shopId: string, type?: 'packaging' | 'product_cost' | 'material_cost') {
  return useQuery({
    queryKey: KEYS.list(shopId, type),
    queryFn: () => fetchPackagingTemplates(shopId, type),
    enabled: !!shopId,
  })
}

// 전체 템플릿 (판매 등록 시 자동 반영용)
export function useAllTemplates(shopId: string) {
  return useQuery({
    queryKey: KEYS.list(shopId),
    queryFn: () => fetchPackagingTemplates(shopId),
    enabled: !!shopId,
  })
}

const TOAST_LABELS: Record<string, string> = {
  packaging: '포장 템플릿',
  product_cost: '실원가 템플릿',
  material_cost: '부자재 템플릿',
}

export function useCreatePackagingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PackagingTemplateInsert) => createPackagingTemplate(input),
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      const label = TOAST_LABELS[input.type || 'packaging'] || '템플릿'
      toast.success(`${label}이 등록되었습니다`)
    },
    onError: () => {
      toast.error('템플릿 등록에 실패했습니다')
    },
  })
}

export function useUpdatePackagingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PackagingTemplateUpdate }) =>
      updatePackagingTemplate(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('템플릿이 수정되었습니다')
    },
    onError: () => {
      toast.error('템플릿 수정에 실패했습니다')
    },
  })
}

export function useDeletePackagingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePackagingTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('템플릿이 삭제되었습니다')
    },
    onError: () => {
      toast.error('템플릿 삭제에 실패했습니다')
    },
  })
}
