'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useShop() {
  return useQuery({
    queryKey: ['shop'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', authData.user.id)
        .single()

      if (error) throw error
      return data
    },
  })
}
