import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/shared/AppSidebar'
import type { Shop } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) redirect('/login')

  const { data } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', authData.user.id)
    .single()

  const shop = data as Shop | null
  const shopName = shop?.name ?? '내 공방'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar shopName={shopName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
