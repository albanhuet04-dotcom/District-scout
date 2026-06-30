import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Utilisé uniquement côté serveur (API routes) : accès complet, contourne RLS.
// Ne jamais exposer SUPABASE_SERVICE_ROLE_KEY côté client.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
