import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // appelé depuis un Server Component : ignoré, le middleware gère le refresh
          }
        },
      },
    }
  );
}

/**
 * Client "admin" avec la clé service_role — usage EXCLUSIVEMENT côté serveur
 * (route handlers), jamais importé dans un Client Component.
 * Utilisé uniquement quand des opérations doivent contourner RLS de façon
 * contrôlée (ex: validation de soumission publique avec vérifications manuelles).
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
