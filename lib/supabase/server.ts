import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MODE_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

/** Client Supabase côté serveur (lit et écrit la session dans les cookies). Null en mode démo. */
export async function supabaseServeur() {
  if (MODE_DEMO) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (aEcrire) => {
        try {
          aEcrire.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : la session sera rafraîchie à la requête suivante.
        }
      },
    },
  });
}
