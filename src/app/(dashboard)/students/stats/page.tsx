'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AttendanceStats } from '@/features/students/components/AttendanceStats'

export default function StudentStatsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 h-[68px] border-b shrink-0">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">출석 통계</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <AttendanceStats />
        </div>
      </div>
    </div>
  )
}
