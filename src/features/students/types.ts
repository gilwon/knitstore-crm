import type { Student, Subscription, Attendance } from '@/types/database'

export interface StudentWithSub extends Student {
  activeSubscription: Subscription | null
  subscriptions?: Subscription[]
}

export interface StudentWithDetails extends Student {
  subscriptions: Subscription[]
  attendances: (Attendance & { subscription: Pick<Subscription, 'type'> | null })[]
}

export type SubscriptionFilter = 'all' | 'active' | 'expired' | 'exhausted' | 'none'
export type StudentSortBy = 'name' | 'recent_attendance' | 'created_at'

export interface StudentFilterState {
  subscriptionStatus: SubscriptionFilter
  sortBy: StudentSortBy
  search: string
}
