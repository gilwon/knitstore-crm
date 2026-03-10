'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSignUp } from '../hooks/useAuth'
import Link from 'next/link'

const schema = z.object({
  shopName: z.string().min(1, '공방 이름을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

type FormValues = z.infer<typeof schema>

export function SignupForm() {
  const { signUp, loading } = useSignUp()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">🧶 회원가입</CardTitle>
        <CardDescription>공방 정보를 입력하고 시작하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((data) => signUp(data.email, data.password, data.shopName))}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="shopName">공방 이름</Label>
            <Input id="shopName" placeholder="예: 뜨개질 공방 하늘" {...register('shopName')} />
            {errors.shopName && <p className="text-sm text-red-500">{errors.shopName.message}</p>}
          </div>
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
          <div className="space-y-1">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input id="passwordConfirm" type="password" {...register('passwordConfirm')} />
            {errors.passwordConfirm && <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary underline">로그인</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
