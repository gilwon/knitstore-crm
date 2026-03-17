'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

async function callSmartstoreAPI(body: Record<string, unknown>) {
  const res = await fetch('/api/smartstore/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || '요청 실패')
  }
  return res.json()
}

export function useSmartstoreSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      callSmartstoreAPI({ from, to }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['onlineSales'] })
      toast.success(`${data.synced}건 동기화 완료, ${data.skipped}건 건너뜀`)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

export function useSmartstoreTest() {
  return useMutation({
    mutationFn: () => callSmartstoreAPI({ test: true }),
  })
}
