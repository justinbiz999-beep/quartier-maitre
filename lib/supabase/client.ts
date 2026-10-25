"use client";

import { createBrowserClient } from "@supabase/ssr";
import { MODE_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

/** Client Supabase côté navigateur. Renvoie null en mode démo. */
export function supabaseNavigateur() {
  if (MODE_DEMO) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
