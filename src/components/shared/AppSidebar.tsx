'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Users, ShoppingCart, Receipt, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSignOut } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/inventory', label: '재고 관리', icon: Package },
  { href: '/students', label: '수강생', icon: Users },
  { href: '/pos', label: 'POS 판매', icon: ShoppingCart },
  { href: '/sales', label: '판매 내역', icon: Receipt },
  { href: '/settings', label: '설정', icon: Settings },
]

interface AppSidebarProps {
  shopName: string
}

export function AppSidebar({ shopName }: AppSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useSignOut()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="flex flex-col w-56 h-full bg-sidebar border-r border-sidebar-border shrink-0">
      {/* 공방 헤더 */}
      <Link href="/dashboard" className="flex items-center h-[68px] px-4 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-xs text-sidebar-primary-foreground font-bold">K</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sidebar-foreground truncate text-sm">{shopName}</p>
            <p className="text-xs text-muted-foreground">KnitStore Manager</p>
          </div>
        </div>
      </Link>

      {/* 내비게이션 */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 하단 버튼 */}
      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors"
        >
          <Sun size={16} strokeWidth={1.8} className="dark:hidden" />
          <Moon size={16} strokeWidth={1.8} className="hidden dark:block" />
          <span className="dark:hidden">다크 모드</span>
          <span className="hidden dark:block">라이트 모드</span>
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors"
        >
          <LogOut size={16} strokeWidth={1.8} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
