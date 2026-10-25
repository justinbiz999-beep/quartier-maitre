"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BandeauDemo } from "@/components/BandeauDemo";
import { Marque } from "@/components/Marque";
import { MODE_DEMO, SITE_URL } from "@/lib/config";
import { supabaseNavigateur } from "@/lib/supabase/client";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "envoye" | "erreur">("saisie");

  const retour = () => `${SITE_URL || window.location.origin}/auth/retour`;

  async function lienParEmail(e: React.FormEvent) {
    e.preventDefault();
    if (MODE_DEMO) return router.push("/installation");
    setEtat("envoi");
    const { error } = await supabaseNavigateur()!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: retour(), shouldCreateUser: true },
    });
    setEtat(error ? "erreur" : "envoye");
  }

  async function avecGoogle() {
    if (MODE_DEMO) return router.push("/installation");
    await supabaseNavigateur()!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: retour() } });
  }

  return (
    <>
      <BandeauDemo />
      <header className="mx-auto max-w-6xl px-4 py-4">
        <Marque />
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pb-16 pt-6">
        <h1 className="m-0 text-3xl font-extrabold">Monter à bord</h1>

        {etat === "envoye" ? (
          <div className="bloc flex flex-col gap-2 p-6" role="status">
            <p className="m-0 font-pixel text-xl font-bold">Regardez vos emails</p>
            <p className="m-0">
              Un lien de connexion vient de partir vers <strong>{email}</strong>. Il est valable une heure.
            </p>
          </div>
        ) : (
          <div className="bloc flex flex-col gap-5 p-6">
            <form onSubmit={lienParEmail} className="flex flex-col gap-3">
              <label htmlFor="email" className="font-bold">
                Votre email
              </label>
              <input
                id="email"
                type="email"
                required={!MODE_DEMO}
                autoComplete="email"
                className="champ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
              />
              <button type="submit" className="btn btn-principal" disabled={etat === "envoi"}>
                {MODE_DEMO ? "Entrer en mode démo" : etat === "envoi" ? "Envoi…" : "Recevoir mon lien de connexion"}
              </button>
              {etat === "erreur" && (
                <p className="m-0 font-semibold text-alerte" role="alert">
                  Le lien n&apos;est pas parti. Vérifiez l&apos;adresse et réessayez.
                </p>
              )}
            </form>
            <div className="flex items-center gap-3 text-sm text-gris">
              <span className="h-0.5 flex-1 bg-trait" />
              ou
              <span className="h-0.5 flex-1 bg-trait" />
            </div>
            <button type="button" className="btn" onClick={avecGoogle}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z" />
                <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5Z" />
                <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" />
                <path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3c.9-2.7 3.4-4.7 6.4-4.7Z" />
              </svg>
              Continuer avec Google
            </button>
            <p className="m-0 text-sm text-gris">Pas de mot de passe : un lien par email, ou votre compte Google.</p>
          </div>
        )}

        <p className="m-0 text-sm">
          Pas encore invité ?{" "}
          <Link href="/#invitation" className="text-encre underline">
            Demander une invitation
          </Link>
        </p>
      </main>
    </>
  );
}
