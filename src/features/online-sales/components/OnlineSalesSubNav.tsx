'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/online-sales', label: '판매 관리' },
  { href: '/online-sales/dashboard', label: '이익 분석' },
  { href: '/online-sales/packaging', label: '원가 템플릿' },
]

export function OnlineSalesSubNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b mb-4">
      {tabs.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
