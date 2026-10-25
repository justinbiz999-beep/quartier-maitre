import { NextResponse, type NextRequest } from "next/server";
import { supabaseServeur } from "@/lib/supabase/server";

// Arrivée depuis le lien email ou Google : on ouvre la session, puis
// direction l'installation (premier passage) ou le QG (déjà installé).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const sb = await supabaseServeur();

  if (!sb || !code) return NextResponse.redirect(new URL("/connexion", url.origin));

  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/connexion?erreur=lien", url.origin));

  const { data } = await sb.from("projets").select("user_id").maybeSingle();
  return NextResponse.redirect(new URL(data ? "/qg" : "/installation", url.origin));
}
