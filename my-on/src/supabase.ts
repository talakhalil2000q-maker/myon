/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// The correct base Project URL from your Supabase dashboard is:
// https://odkgcxtpgiymolqqvcnb.supabase.co
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://odkgcxtpgiymolqqvcnb.supabase.co').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Sanitize the project URL to ensure it is the base URL only (e.g., https://PROJECT.supabase.co)
// and does not contain /rest/v1 or trailing slashes, which causes PGRST125: Invalid path specified in request URL.
let supabaseUrl = rawSupabaseUrl;
if (supabaseUrl) {
  // Remove any trailing slashes first
  supabaseUrl = supabaseUrl.replace(/\/+$/, '');
  // Remove /rest/v1 suffix if it exists
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1$/, '');
}

// Safely check if Supabase is fully configured.
// This prevents boot crashes in environments where environment variables are not yet populated.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-project.supabase.co');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration is missing or using placeholder values. ' +
    'The application will gracefully fallback to persistent LocalStorage until ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are configured.'
  );
}
