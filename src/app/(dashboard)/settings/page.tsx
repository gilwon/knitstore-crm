'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useShopSettings, useUpdateShopName, useUpdatePassword, useUpdateSmartstoreKeys } from '@/features/settings/hooks/useSettings'
import { useSmartstoreTest } from '@/features/online-sales/hooks/useSmartstoreSync'

export default function SettingsPage() {
  const router = useRouter()
  const { data, isLoading } = useShopSettings()

  const [shopName, setShopName] = useState('')
  const updateShopName = useUpdateShopName()

  useEffect(() => {
    if (data?.shop.name) setShopName(data.shop.name)
  }, [data?.shop.name])

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const updatePassword = useUpdatePassword()

  // 스마트스토어 API 키
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')
  const updateSmartstoreKeys = useUpdateSmartstoreKeys()
  const smartstoreTest = useSmartstoreTest()

  useEffect(() => {
    if (data?.shop.smartstore_client_id) setClientId(data.shop.smartstore_client_id)
    if (data?.shop.smartstore_client_secret) setClientSecret(data.shop.smartstore_client_secret)
  }, [data?.shop.smartstore_client_id, data?.shop.smartstore_client_secret])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPw.length < 6) return alert('새 비밀번호는 6자 이상이어야 합니다')
    if (newPw !== confirmPw) return alert('새 비밀번호가 일치하지 않습니다')
    await updatePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center px-6 h-[68px] border-b shrink-0">
        <div>
          <h1 className="text-xl font-semibold">설정</h1>
          <p className="text-sm text-muted-foreground mt-0.5">공방 정보 및 계정을 관리합니다</p>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">

          {/* 공방 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">공방 정보</CardTitle>
              <CardDescription>공방 이름을 변경합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="shop-name">공방명</Label>
                <div className="flex gap-2">
                  <Input
                    id="shop-name"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="공방 이름을 입력하세요"
                  />
                  <Button
                    onClick={() => {
                      if (data?.shop.id) {
                        updateShopName.mutate({ shopId: data.shop.id, name: shopName })
                      }
                    }}
                    disabled={updateShopName.isPending || !shopName.trim() || shopName === data?.shop.name}
                  >
                    {updateShopName.isPending ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계정 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">계정 정보</CardTitle>
              <CardDescription>로그인에 사용되는 계정 정보입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label>이메일</Label>
                <Input value={data?.email ?? ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
              </div>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">비밀번호 변경</CardTitle>
              <CardDescription>보안을 위해 주기적으로 변경해주세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current-pw">현재 비밀번호</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">새 비밀번호</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="6자 이상"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">새 비밀번호 확인</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updatePassword.isPending || !currentPw || !newPw || !confirmPw}
                >
                  {updatePassword.isPending ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 스마트스토어 연동 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">스마트스토어 연동</CardTitle>
              <CardDescription>네이버 커머스 API 자격 증명을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="smartstore-client-id">Client ID</Label>
                <Input
                  id="smartstore-client-id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="네이버 커머스 API Client ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smartstore-client-secret">Client Secret</Label>
                <Input
                  id="smartstore-client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="네이버 커머스 API Client Secret"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={smartstoreTest.isPending || !clientId.trim() || !clientSecret.trim()}
                  onClick={async () => {
                    setTestStatus('testing')
                    setTestError('')
                    try {
                      // 먼저 키를 저장한 뒤 테스트
                      if (data?.shop.id) {
                        await updateSmartstoreKeys.mutateAsync({
                          shopId: data.shop.id,
                          clientId,
                          clientSecret,
                        })
                      }
                      await smartstoreTest.mutateAsync()
                      setTestStatus('success')
                    } catch (err) {
                      setTestStatus('error')
                      setTestError(err instanceof Error ? err.message : '연결 실패')
                    }
                  }}
                >
                  {testStatus === 'testing' ? '테스트 중...' : '연결 테스트'}
                </Button>
                <Button
                  disabled={updateSmartstoreKeys.isPending || !clientId.trim() || !clientSecret.trim()}
                  onClick={() => {
                    if (data?.shop.id) {
                      updateSmartstoreKeys.mutate({
                        shopId: data.shop.id,
                        clientId,
                        clientSecret,
                      })
                    }
                  }}
                >
                  {updateSmartstoreKeys.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
              {testStatus === 'success' && (
                <p className="text-sm text-green-600">연결 성공</p>
              )}
              {testStatus === 'error' && (
                <p className="text-sm text-destructive">연결 실패: {testError}</p>
              )}
            </CardContent>
          </Card>

          {/* 계정 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">계정 관리</CardTitle>
              <CardDescription>로그아웃하거나 계정을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
