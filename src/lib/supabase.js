import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Tanpa URL/kunci, aplikasi berjalan dalam Mode Demo (data disimpan di browser).
export const modeDemo = !url || !key
export const supabase = modeDemo ? null : createClient(url, key)
