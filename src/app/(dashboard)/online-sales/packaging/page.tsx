'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { OnlineSalesSubNav } from '@/features/online-sales/components/OnlineSalesSubNav'
import { PackagingTemplateList } from '@/features/online-sales/components/PackagingTemplateList'
import { PackagingTemplateForm } from '@/features/online-sales/components/PackagingTemplateForm'
import { usePackagingTemplates } from '@/features/online-sales/hooks/usePackagingTemplates'
import { useShop } from '@/features/inventory/hooks/useShop'
import type { PackagingTemplate } from '@/features/online-sales/types'

export default function PackagingPage() {
  const { data: shop } = useShop()
  const shopId = shop?.id || ''

  const { data: templates = [], isLoading } = usePackagingTemplates(shopId)
  const [formOpen, setFormOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<PackagingTemplate | null>(null)

  const handleEdit = (tpl: PackagingTemplate) => {
    setEditTemplate(tpl)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditTemplate(null)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="온라인 판매" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <OnlineSalesSubNav />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{templates.length}개 템플릿</p>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={14} className="mr-1" /> 원가 템플릿 추가
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>
        ) : (
          <PackagingTemplateList templates={templates} onEdit={handleEdit} />
        )}
      </div>

      {shopId && (
        <PackagingTemplateForm
          shopId={shopId}
          open={formOpen}
          onOpenChange={handleFormClose}
          editTemplate={editTemplate}
        />
      )}
    </div>
  )
}
