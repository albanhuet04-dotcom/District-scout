import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let _client;

// Singleton: évite de recréer un client à chaque rendu (et de perdre la session).
export function createClient() {
  if (_client) return _client;
  _client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
  return _client;
}
