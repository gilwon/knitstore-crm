'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubscriptionForm } from './SubscriptionForm'
import type { Subscription } from '@/types/database'

interface RenewSubscriptionButtonProps {
  subscription: Subscription
  studentId: string
  studentName: string
}

export function RenewSubscriptionButton({ subscription, studentId, studentName }: RenewSubscriptionButtonProps) {
  const [open, setOpen] = useState(false)

  if (subscription.status !== 'expired' && subscription.status !== 'exhausted') {
    return null
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        title="동일 조건 재발급"
        onClick={() => setOpen(true)}
      >
        <RefreshCw size={13} />
      </Button>
      <SubscriptionForm
        open={open}
        onOpenChange={setOpen}
        studentId={studentId}
        studentName={studentName}
        renewFrom={subscription}
      />
    </>
  )
}
