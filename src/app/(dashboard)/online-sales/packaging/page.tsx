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
import { cn } from '@/lib/utils'
import type { PackagingTemplate } from '@/features/online-sales/types'

type TemplateType = 'packaging' | 'product_cost' | 'material_cost'

const TABS: { type: TemplateType; label: string; addLabel: string; emptyMsg: string }[] = [
  { type: 'packaging', label: '포장 템플릿', addLabel: '포장 템플릿 추가', emptyMsg: '등록된 포장 템플릿이 없습니다' },
  { type: 'product_cost', label: '실원가 템플릿', addLabel: '실원가 템플릿 추가', emptyMsg: '등록된 실원가 템플릿이 없습니다' },
  { type: 'material_cost', label: '부자재 템플릿', addLabel: '부자재 템플릿 추가', emptyMsg: '등록된 부자재 템플릿이 없습니다' },
]

export default function PackagingPage() {
  const { data: shop } = useShop()
  const shopId = shop?.id || ''

  const [activeTab, setActiveTab] = useState<TemplateType>('packaging')
  const { data: templates = [], isLoading } = usePackagingTemplates(shopId, activeTab)
  const [formOpen, setFormOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<PackagingTemplate | null>(null)

  const currentTab = TABS.find((t) => t.type === activeTab)!

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

        {/* 템플릿 타입 탭 */}
        <div className="flex gap-1">
          {TABS.map(({ type, label }) => (
            <Button
              key={type}
              size="sm"
              variant={activeTab === type ? 'default' : 'ghost'}
              onClick={() => setActiveTab(type)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{templates.length}개 템플릿</p>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={14} className="mr-1" /> {currentTab.addLabel}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>
        ) : (
          <PackagingTemplateList
            templates={templates}
            onEdit={handleEdit}
            emptyMessage={currentTab.emptyMsg}
          />
        )}
      </div>

      {shopId && (
        <PackagingTemplateForm
          shopId={shopId}
          open={formOpen}
          onOpenChange={handleFormClose}
          templateType={activeTab}
          editTemplate={editTemplate}
        />
      )}
    </div>
  )
}
