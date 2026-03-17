'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSmartstoreSync } from '@/features/online-sales/hooks/useSmartstoreSync'

interface Props {
  shopId: string
  hasApiKeys: boolean
}

function getDefaultFrom() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function getDefaultTo() {
  return new Date().toISOString().split('T')[0]
}

export function SmartstoreSyncButton({ shopId: _shopId, hasApiKeys }: Props) {
  const [open, setOpen] = useState(false)
  const [syncFrom, setSyncFrom] = useState(getDefaultFrom)
  const [syncTo, setSyncTo] = useState(getDefaultTo)
  const sync = useSmartstoreSync()

  if (!hasApiKeys) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button size="sm" variant="outline" disabled>
              <RefreshCw size={14} className="mr-1" /> 스마트스토어 동기화
            </Button>
          </TooltipTrigger>
          <TooltipContent>설정에서 API 키를 먼저 등록하세요</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button size="sm" variant="outline">
            <RefreshCw size={14} className="mr-1" /> 스마트스토어 동기화
          </Button>
        }
      />
      <PopoverContent className="w-80" align="start">
        <PopoverHeader>
          <PopoverTitle>동기화 기간</PopoverTitle>
          <PopoverDescription>
            스마트스토어 주문을 가져올 기간을 선택하세요
          </PopoverDescription>
        </PopoverHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="sync-from">시작일</Label>
              <Input
                id="sync-from"
                type="date"
                value={syncFrom}
                onChange={(e) => setSyncFrom(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground pt-5">~</span>
            <div className="flex-1 space-y-1">
              <Label htmlFor="sync-to">종료일</Label>
              <Input
                id="sync-to"
                type="date"
                value={syncTo}
                onChange={(e) => setSyncTo(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full"
            size="sm"
            disabled={sync.isPending || !syncFrom || !syncTo}
            onClick={() => sync.mutate({ from: syncFrom, to: syncTo })}
          >
            {sync.isPending ? '동기화 중...' : '동기화 시작'}
          </Button>

          {sync.isSuccess && sync.data && (
            <div className="rounded-md bg-muted p-2 text-sm space-y-0.5">
              <p className="text-green-600">{sync.data.synced}건 동기화 완료</p>
              <p className="text-muted-foreground">{sync.data.skipped}건 중복 건너뜀</p>
            </div>
          )}

          {sync.isError && (
            <p className="text-sm text-destructive">
              {sync.error instanceof Error ? sync.error.message : '동기화 실패'}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
