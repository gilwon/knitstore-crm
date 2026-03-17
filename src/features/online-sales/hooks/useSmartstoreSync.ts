'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useSmartstoreSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const res = await fetch('/api/smartstore/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '동기화 실패')
      }
      return res.json()
    },
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
    mutationFn: async () => {
      const res = await fetch('/api/smartstore/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '연결 실패')
      }
      return res.json()
    },
  })
}
