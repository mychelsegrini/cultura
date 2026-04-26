import { createClient } from '@supabase/supabase-js'
const API_KEY = import.meta.env.VITE_API_KEY
const URL = import.meta.env.VITE_URL

export const supabase = createClient(URL, API_KEY)
