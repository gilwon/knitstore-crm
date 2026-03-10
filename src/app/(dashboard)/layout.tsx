import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/shared/DashboardShell'
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
    <DashboardShell shopName={shopName}>
      {children}
    </DashboardShell>
  )
}
