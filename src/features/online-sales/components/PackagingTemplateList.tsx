'use client'

import { Pencil, Trash2, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDeletePackagingTemplate } from '../hooks/usePackagingTemplates'
import type { PackagingTemplate } from '../types'

interface Props {
  templates: PackagingTemplate[]
  onEdit: (template: PackagingTemplate) => void
  emptyMessage?: string
}

export function PackagingTemplateList({ templates, onEdit, emptyMessage = '등록된 템플릿이 없습니다' }: Props) {
  const deleteMutation = useDeletePackagingTemplate()

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package size={40} strokeWidth={1.2} className="mb-3" />
        <p className="text-sm">{emptyMessage}</p>
        <p className="text-xs mt-1">상품별로 미리 등록하면 판매 입력 시 자동 반영됩니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.map((tpl) => (
        <Card key={tpl.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{tpl.product_name}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(tpl)}>
                  <Pencil size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate(tpl.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 mb-2">
              {(tpl.items as { name: string; cost: number }[]).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span>{item.cost.toLocaleString()}원</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>합계</span>
              <span>{tpl.total_cost.toLocaleString()}원</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
