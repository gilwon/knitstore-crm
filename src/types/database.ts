// Supabase 자동생성 타입 (Supabase CLI로 실제 생성: npx supabase gen types typescript)
// 현재는 수동 정의 - DB 연결 후 자동생성 타입으로 교체 예정

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          shop_id: string
          brand: string
          name: string
          color_code: string
          color_name: string
          unit: 'ball' | 'g'
          price: number
          alert_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          brand?: string
          name: string
          color_code?: string
          color_name?: string
          unit: 'ball' | 'g'
          price?: number
          alert_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          brand?: string
          name?: string
          color_code?: string
          color_name?: string
          unit?: 'ball' | 'g'
          price?: number
          alert_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          }
        ]
      }
      lots: {
        Row: {
          id: string
          product_id: string
          lot_number: string
          stock_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          lot_number: string
          stock_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          lot_number?: string
          stock_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lots_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      stock_movements: {
        Row: {
          id: string
          lot_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          memo: string | null
          sale_item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          type: 'in' | 'out'
          quantity: number
          reason?: string
          memo?: string | null
          sale_item_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lot_id?: string
          type?: 'in' | 'out'
          quantity?: number
          reason?: string
          memo?: string | null
          sale_item_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_movements_lot_id_fkey'
            columns: ['lot_id']
            isOneToOne: false
            referencedRelation: 'lots'
            referencedColumns: ['id']
          }
        ]
      }
      students: {
        Row: {
          id: string
          shop_id: string
          name: string
          phone: string | null
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          name: string
          phone?: string | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          name?: string
          phone?: string | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'students_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          student_id: string
          type: 'count' | 'period'
          total_count: number | null
          remaining: number | null
          starts_at: string
          expires_at: string | null
          price: number
          status: 'active' | 'expired' | 'exhausted'
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          type: 'count' | 'period'
          total_count?: number | null
          remaining?: number | null
          starts_at?: string
          expires_at?: string | null
          price?: number
          status?: 'active' | 'expired' | 'exhausted'
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          type?: 'count' | 'period'
          total_count?: number | null
          remaining?: number | null
          starts_at?: string
          expires_at?: string | null
          price?: number
          status?: 'active' | 'expired' | 'exhausted'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          }
        ]
      }
      attendances: {
        Row: {
          id: string
          student_id: string
          subscription_id: string
          attended_at: string
          memo: string | null
        }
        Insert: {
          id?: string
          student_id: string
          subscription_id: string
          attended_at?: string
          memo?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          subscription_id?: string
          attended_at?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendances_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendances_subscription_id_fkey'
            columns: ['subscription_id']
            isOneToOne: false
            referencedRelation: 'subscriptions'
            referencedColumns: ['id']
          }
        ]
      }
      sales: {
        Row: {
          id: string
          shop_id: string
          type: 'product_sale' | 'class_fee'
          total_amount: number
          student_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          type: 'product_sale' | 'class_fee'
          total_amount?: number
          student_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          type?: 'product_sale' | 'class_fee'
          total_amount?: number
          student_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sales_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          }
        ]
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          lot_id: string | null
          subscription_id: string | null
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          sale_id: string
          lot_id?: string | null
          subscription_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
        Update: {
          id?: string
          sale_id?: string
          lot_id?: string | null
          subscription_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sale_items_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sales'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      process_stock_in: {
        Args: {
          p_lot_id: string
          p_quantity: number
          p_reason?: string
          p_memo?: string | null
        }
        Returns: string
      }
      process_stock_out: {
        Args: {
          p_lot_id: string
          p_quantity: number
          p_reason?: string
          p_memo?: string | null
          p_sale_item_id?: string | null
        }
        Returns: string
      }
      process_attendance: {
        Args: {
          p_student_id: string
          p_subscription_id: string
          p_memo?: string | null
        }
        Returns: string
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// 편의용 타입 별칭
export type Shop = Database['public']['Tables']['shops']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Lot = Database['public']['Tables']['lots']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Attendance = Database['public']['Tables']['attendances']['Row']
export type Sale = Database['public']['Tables']['sales']['Row']
export type SaleItem = Database['public']['Tables']['sale_items']['Row']
