import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          admission_no: string;
          class_code: string;
          balance: number;
          total_paid: number;
          total_spent: number;
          last_payment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          admission_no: string;
          class_code: string;
          balance?: number;
          total_paid?: number;
          total_spent?: number;
          last_payment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          admission_no?: string;
          class_code?: string;
          balance?: number;
          total_paid?: number;
          total_spent?: number;
          last_payment?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          type: 'deposit' | 'spend';
          method: 'online' | 'bycash' | 'credit';
          note: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          type: 'deposit' | 'spend';
          method: 'online' | 'bycash' | 'credit';
          note?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          type?: 'deposit' | 'spend';
          method?: 'online' | 'bycash' | 'credit';
          note?: string | null;
          timestamp?: string;
        };
      };
      stock_items: {
        Row: {
          id: string;
          item_name: string;
          quantity: number;
          cost_price: number;
          selling_price: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          item_name: string;
          quantity?: number;
          cost_price: number;
          selling_price: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          item_name?: string;
          quantity?: number;
          cost_price?: number;
          selling_price?: number;
          last_updated?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          student_id: string;
          item_id: string;
          quantity: number;
          total_price: number;
          timestamp: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          item_id: string;
          quantity: number;
          total_price: number;
          timestamp?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          item_id?: string;
          quantity?: number;
          total_price?: number;
          timestamp?: string;
        };
      };
    };
  };
};