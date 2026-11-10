import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const url = supabaseUrl
const key = supabaseKey

// Tanpa URL/kunci, aplikasi berjalan dalam Mode Demo (data disimpan di browser).
export const modeDemo = !url || !key
export const supabase = modeDemo ? null : createClient(url, key)
