
import { createClient } from '@supabase/supabase-js';

// Use the environment variables provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Key. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
