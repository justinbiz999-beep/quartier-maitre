"use client";

// Point d'accès unique aux données pour les écrans.
// Mode démo : navigateur. Mode réel : Supabase (cloisonné par utilisateur, voir supabase/migrations).

import { MODE_DEMO } from "@/lib/config";
import { deciderDemo, enregistrerProjetDemo, lireDemo } from "@/lib/demo";
import { supabaseNavigateur } from "@/lib/supabase/client";
import type { LigneJournal, Projet, Proposition, StatutProposition } from "@/lib/types";

export type Etat = {
  projet: Projet | null;
  propositions: Proposition[];
  journal: LigneJournal[];
};

export async function chargerEtat(): Promise<Etat> {
  if (MODE_DEMO) return lireDemo();
  const sb = supabaseNavigateur()!;
  const [projet, props, jour] = await Promise.all([
    sb.from("projets").select("reponses, regles, installe_le").maybeSingle(),
    sb.from("propositions").select("*").order("cree_le", { ascending: false }).limit(50),
    sb.from("journal").select("*").order("le", { ascending: false }).limit(80),
  ]);
  return {
    projet: projet.data
      ? { reponses: projet.data.reponses, regles: projet.data.regles, installeLe: projet.data.installe_le }
      : null,
    propositions: (props.data ?? []).map((p) => ({
      id: p.id,
      equipe: p.equipe,
      titre: p.titre,
      pourquoi: p.pourquoi,
      action: p.action_texte,
      sources: p.sources ?? [],
      creeeLe: p.cree_le,
      expireLe: p.expire_le,
      statut: p.statut,
      commentaire: p.commentaire ?? undefined,
    })),
    journal: (jour.data ?? []).map((j) => ({ id: String(j.id), equipe: j.equipe, texte: j.texte, le: j.le })),
  };
}

export async function enregistrerProjet(projet: Projet): Promise<void> {
  if (MODE_DEMO) return enregistrerProjetDemo(projet);
  const sb = supabaseNavigateur()!;
  const { error } = await sb.rpc("installer_projet", {
    p_reponses: projet.reponses,
    p_regles: projet.regles,
  });
  if (error) throw new Error("L'enregistrement du projet n'est pas passé. Réessayez.");
}

export async function decider(id: string, statut: StatutProposition, commentaire?: string): Promise<Etat> {
  if (MODE_DEMO) return deciderDemo(id, statut, commentaire);
  const sb = supabaseNavigateur()!;
  const { error } = await sb.rpc("decider_proposition", {
    p_id: id,
    p_statut: statut,
    p_commentaire: commentaire ?? null,
  });
  if (error) throw new Error("La décision n'est pas passée. Réessayez.");
  return chargerEtat();
}
