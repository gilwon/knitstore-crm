import { createClient } from '@/lib/supabase/client'
import type { StudentWithSub, StudentWithDetails } from './types'
import type { Database } from '@/types/database'

type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

export async function fetchStudents(): Promise<StudentWithSub[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*, subscriptions(*)')
    .order('name', { ascending: true })
  if (error) throw error

  return (data ?? []).map((s) => {
    const subs = (s.subscriptions ?? []) as import('@/types/database').Subscription[]
    const active = subs.find((sub) => sub.status === 'active') ?? null
    return { ...s, activeSubscription: active } as StudentWithSub
  })
}

export async function fetchStudent(id: string): Promise<StudentWithDetails> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*, subscriptions(*), attendances(*, subscription:subscriptions(type))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as StudentWithDetails
}

export async function createStudent(input: {
  shop_id: string
  name: string
  phone?: string
  memo?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('students').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateStudent(id: string, updates: {
  name?: string
  phone?: string | null
  memo?: string | null
}) {
  const supabase = createClient()
  const { error } = await supabase.from('students').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteStudent(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

export async function createSubscription(input: {
  student_id: string
  type: 'count' | 'period'
  total_count?: number
  starts_at: string
  expires_at?: string
  price: number
}) {
  const supabase = createClient()
  const payload: SubscriptionInsert = {
    student_id: input.student_id,
    type: input.type,
    starts_at: input.starts_at,
    price: input.price,
    status: 'active',
    total_count: input.type === 'count' ? (input.total_count ?? null) : null,
    remaining: input.type === 'count' ? (input.total_count ?? null) : null,
    expires_at: input.type === 'period' ? (input.expires_at ?? null) : null,
  }
  const { data, error } = await supabase.from('subscriptions').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function processAttendance(params: {
  studentId: string
  subscriptionId: string
  memo?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('process_attendance', {
    p_student_id: params.studentId,
    p_subscription_id: params.subscriptionId,
    p_memo: params.memo ?? null,
  })
  if (error) throw error
  return data
}
