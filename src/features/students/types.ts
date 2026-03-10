import type { Student, Subscription, Attendance } from '@/types/database'

export interface StudentWithSub extends Student {
  activeSubscription: Subscription | null
}

export interface StudentWithDetails extends Student {
  subscriptions: Subscription[]
  attendances: (Attendance & { subscription: Pick<Subscription, 'type'> | null })[]
}
