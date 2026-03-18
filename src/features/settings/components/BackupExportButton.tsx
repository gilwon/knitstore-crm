'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildAndDownloadBackup } from '../utils/backup'
import { toast } from 'sonner'

interface BackupExportButtonProps {
  shopName: string
}

export function BackupExportButton({ shopName }: BackupExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleBackup() {
    setLoading(true)
    try {
      await buildAndDownloadBackup(shopName)
      toast.success('백업 파일이 다운로드되었습니다')
    } catch {
      toast.error('백업 생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">데이터 백업</CardTitle>
        <CardDescription>전체 데이터를 엑셀 파일로 다운로드합니다 (상품, 로트, 수강생, 수강권, 판매, 출결)</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={handleBackup} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              백업 생성 중...
            </>
          ) : (
            <>
              <Download size={14} />
              전체 데이터 백업 (.xlsx)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
