'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AppSidebar } from './AppSidebar'

interface DashboardShellProps {
  shopName: string
  children: React.ReactNode
}

export function DashboardShell({ shopName, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AppSidebar
        shopName={shopName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center h-[68px] px-4 border-b bg-background shrink-0 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu size={20} />
          </button>
          <span className="ml-2 font-semibold text-sm">{shopName}</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
