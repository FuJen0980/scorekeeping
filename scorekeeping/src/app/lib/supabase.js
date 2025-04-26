import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  if (typeof window === 'undefined') {
    // On the server, don't create a client!
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}