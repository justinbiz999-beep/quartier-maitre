"use client";

import { useState } from "react";
import { MODE_DEMO } from "@/lib/config";
import { supabaseNavigateur } from "@/lib/supabase/client";

export function FormulaireAttente() {
  const [email, setEmail] = useState("");
  const [plateforme, setPlateforme] = useState("Shopify");
  const [perte, setPerte] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "ok" | "erreur">("saisie");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEtat("envoi");
    if (MODE_DEMO) {
      setEtat("ok");
      return;
    }
    const sb = supabaseNavigateur()!;
    const { error } = await sb
      .from("liste_attente")
      .insert({ email: email.trim(), plateforme, perte_de_temps: perte.trim() || null });
    // Un email déjà inscrit renvoie une erreur d'unicité : pour la personne, c'est réussi quand même.
    if (error && error.code !== "23505") setEtat("erreur");
    else setEtat("ok");
  }

  if (etat === "ok") {
    return (
      <div className="bloc p-6" role="status">
        <p className="m-0 font-pixel text-xl font-bold">C&apos;est noté.</p>
        <p className="mb-0 mt-2">
          Les invitations partent par petites vagues. Vous recevrez un email dès qu&apos;une place se libère.
          {MODE_DEMO && " (Mode démo : rien n'a été enregistré.)"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="bloc flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="font-bold">
          Votre email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="champ"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="plateforme" className="font-bold">
          Votre boutique est sur
        </label>
        <select id="plateforme" className="champ" value={plateforme} onChange={(e) => setPlateforme(e.target.value)}>
          <option>Shopify</option>
          <option>WooCommerce</option>
          <option>Wix</option>
          <option>Autre plateforme</option>
          <option>Pas encore de boutique</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="perte" className="font-bold">
          Ce qui vous fait perdre le plus de temps <span className="font-normal text-gris">(facultatif)</span>
        </label>
        <textarea
          id="perte"
          rows={2}
          maxLength={500}
          className="champ"
          value={perte}
          onChange={(e) => setPerte(e.target.value)}
          placeholder="Répondre aux clients, surveiller les prix…"
        />
      </div>
      <button type="submit" className="btn btn-principal" disabled={etat === "envoi"}>
        {etat === "envoi" ? "Envoi…" : "Demander une invitation"}
      </button>
      {etat === "erreur" && (
        <p className="m-0 font-semibold text-alerte" role="alert">
          L&apos;inscription n&apos;est pas passée. Réessayez dans un instant.
        </p>
      )}
      <p className="m-0 text-sm text-gris">
        Votre email sert uniquement à vous inviter. Voir la{" "}
        <a href="/confidentialite" className="text-encre underline">
          politique de confidentialité
        </a>
        .
      </p>
    </form>
  );
}
