// Mode démo : tout est gardé dans le navigateur, avec des propositions d'exemple.
// Sert tant que Supabase n'est pas branché, et pour montrer l'app sans compte.

import type { LigneJournal, Projet, Proposition, StatutProposition } from "@/lib/types";

const CLE = "qm-demo-v1";

type EtatDemo = {
  projet: Projet | null;
  propositions: Proposition[];
  journal: LigneJournal[];
};

function ilYa(heures: number) {
  return new Date(Date.now() - heures * 3600_000).toISOString();
}
function dans(jours: number) {
  return new Date(Date.now() + jours * 86400_000).toISOString();
}

function etatInitial(): EtatDemo {
  return {
    projet: null,
    propositions: [
      {
        id: "p1",
        equipe: "veille",
        titre: "Un concurrent a baissé son prix de 15 %",
        pourquoi:
          "Le modèle équivalent est passé de 189 € à 159 € chez votre principal concurrent. Votre prix actuel reste dans le marché ; une baisse réduirait votre marge de moitié. Nous proposons de ne pas suivre et de mettre en avant la livraison rapide.",
        action: "Aucune modification de prix. Ajout d'une mention « Livré en 48 h » sur la fiche produit (brouillon Shopify).",
        sources: [{ libelle: "Page produit du concurrent (exemple)", url: "https://example.com" }],
        creeeLe: ilYa(3),
        expireLe: dans(7),
        statut: "en_attente",
        exemple: true,
      },
      {
        id: "p2",
        equipe: "veille",
        titre: "Nouveau concurrent repéré sur votre niche",
        pourquoi: "Une boutique lancée ce mois-ci vend 6 produits proches des vôtres, avec des prix 10 % plus bas. Nous proposons de l'ajouter à la veille du lundi.",
        action: "Ajout de la boutique à la liste suivie par l'équipe Veille.",
        sources: [{ libelle: "Boutique repérée (exemple)", url: "https://example.com" }],
        creeeLe: ilYa(5),
        expireLe: dans(7),
        statut: "en_attente",
        exemple: true,
      },
      {
        id: "p3",
        equipe: "sav",
        titre: "Réponse prête pour une cliente qui attend sa commande",
        pourquoi: "La commande a été expédiée il y a 6 jours ; le transporteur indique une livraison demain. La cliente demande où en est son colis.",
        action:
          "Envoi depuis votre boîte : « Bonjour, votre colis est en route et devrait arriver demain. Voici le lien de suivi : [lien]. Belle journée ! »",
        sources: [{ libelle: "Suivi transporteur (exemple)", url: "https://example.com" }],
        creeeLe: ilYa(1),
        expireLe: dans(7),
        statut: "en_attente",
        exemple: true,
      },
    ],
    journal: [
      { id: "j1", equipe: "etudes", texte: "Passage en cours : 3 niches en mesure.", le: ilYa(0.2) },
      { id: "j2", equipe: "sav", texte: "1 réponse client préparée, en attente de validation.", le: ilYa(1) },
      { id: "j3", equipe: "veille", texte: "Veille des concurrents terminée : 2 propositions.", le: ilYa(3) },
      { id: "j4", equipe: "finance", texte: "Point de marge de la semaine envoyé. Prochain passage vendredi.", le: ilYa(48) },
    ],
  };
}

export function lireDemo(): EtatDemo {
  try {
    const brut = window.localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as EtatDemo;
  } catch {
    // stockage indisponible (navigation privée, etc.) : on repart de l'état initial
  }
  return etatInitial();
}

function ecrire(e: EtatDemo) {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    // sans stockage, la démo fonctionne quand même pour la session en cours
  }
}

export function enregistrerProjetDemo(projet: Projet) {
  const e = lireDemo();
  e.projet = projet;
  e.journal.unshift({ id: `j${Date.now()}`, equipe: "pont", texte: "Équipage installé. Les règles sont transmises à toutes les équipes.", le: new Date().toISOString() });
  ecrire(e);
}

export function deciderDemo(id: string, statut: StatutProposition, commentaire?: string): EtatDemo {
  const e = lireDemo();
  const p = e.propositions.find((x) => x.id === id);
  if (p) {
    p.statut = statut;
    p.commentaire = commentaire;
    const verbe = statut === "validee" ? "Validé" : statut === "refusee" ? "Refusé" : "Commenté";
    e.journal.unshift({
      id: `j${Date.now()}`,
      equipe: p.equipe,
      texte: `${verbe} par vous : « ${p.titre} ».${statut === "validee" ? " L'action part (simulation en mode démo)." : ""}`,
      le: new Date().toISOString(),
    });
  }
  ecrire(e);
  return e;
}

export function reinitialiserDemo() {
  try {
    window.localStorage.removeItem(CLE);
  } catch {
    // rien à faire
  }
}
