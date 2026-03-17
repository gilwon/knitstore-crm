import { createClient } from '@/lib/supabase/client'
import type {
  OnlineSale,
  OnlineSaleInsert,
  OnlineSaleUpdate,
  PackagingTemplate,
  PackagingTemplateInsert,
  PackagingTemplateUpdate,
} from './types'

// === 온라인 판매 ===

export async function fetchOnlineSales(shopId: string, from?: string, to?: string) {
  const supabase = createClient()
  let query = supabase
    .from('online_sales')
    .select('*')
    .eq('shop_id', shopId)
    .order('sale_date', { ascending: false })

  if (from) query = query.gte('sale_date', from)
  if (to) query = query.lte('sale_date', to)

  const { data, error } = await query
  if (error) throw error
  return data as OnlineSale[]
}

export async function createOnlineSale(input: OnlineSaleInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('online_sales')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as OnlineSale
}

export async function updateOnlineSale(id: string, input: OnlineSaleUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('online_sales')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as OnlineSale
}

export async function deleteOnlineSale(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('online_sales')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteOnlineSales(ids: string[]) {
  const supabase = createClient()
  const { error } = await supabase
    .from('online_sales')
    .delete()
    .in('id', ids)
  if (error) throw error
}

// === 포장비 템플릿 ===

export async function fetchPackagingTemplates(shopId: string, type?: 'packaging' | 'product_cost' | 'material_cost') {
  const supabase = createClient()
  let query = supabase
    .from('packaging_templates')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data as PackagingTemplate[]
}

export async function createPackagingTemplate(input: PackagingTemplateInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('packaging_templates')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as PackagingTemplate
}

export async function updatePackagingTemplate(id: string, input: PackagingTemplateUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('packaging_templates')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PackagingTemplate
}

export async function deletePackagingTemplate(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('packaging_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}
