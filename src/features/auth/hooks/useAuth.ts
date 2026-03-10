'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function signUp(email: string, password: string, shopName: string) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { shop_name: shopName },
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('가입 완료! 이메일을 확인해주세요.')
      router.push('/login')
    }
    setLoading(false)
  }

  return { signUp, loading }
}

export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function signIn(email: string, password: string) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
      // 리다이렉트 완료까지 로딩 상태 유지 (setLoading 호출하지 않음)
    }
  }

  return { signIn, loading }
}

export function useSignOut() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return { signOut }
}
