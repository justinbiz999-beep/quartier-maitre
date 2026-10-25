// Sans les réglages Supabase, l'app tourne en mode démo :
// données d'exemple, enregistrées seulement dans ce navigateur.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export const MODE_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;
