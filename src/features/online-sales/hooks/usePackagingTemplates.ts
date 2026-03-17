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
  list: (shopId: string) => ['packagingTemplates', shopId] as const,
}

export function usePackagingTemplates(shopId: string) {
  return useQuery({
    queryKey: KEYS.list(shopId),
    queryFn: () => fetchPackagingTemplates(shopId),
    enabled: !!shopId,
  })
}

export function useCreatePackagingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PackagingTemplateInsert) => createPackagingTemplate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('포장 템플릿이 등록되었습니다')
    },
    onError: () => {
      toast.error('포장 템플릿 등록에 실패했습니다')
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
      toast.success('포장 템플릿이 수정되었습니다')
    },
    onError: () => {
      toast.error('포장 템플릿 수정에 실패했습니다')
    },
  })
}

export function useDeletePackagingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePackagingTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      toast.success('포장 템플릿이 삭제되었습니다')
    },
    onError: () => {
      toast.error('포장 템플릿 삭제에 실패했습니다')
    },
  })
}
