'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSignIn } from '../hooks/useAuth'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const { signIn, loading } = useSignIn()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">로그인 중...</p>
          </div>
        </div>
      )}
      <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">🧶 KnitStore</CardTitle>
        <CardDescription>공방 관리 시스템에 로그인하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((data) => signIn(data.email, data.password))}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="example@email.com" {...register('email')} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary underline">회원가입</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
    </>
  )
}
