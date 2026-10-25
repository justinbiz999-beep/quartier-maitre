export type Reponses = {
  boutique: string;
  budget: string;
  objectif: string;
  refus: string;
  priorite: string; // id d'équipe
};

export type Regle = { id: string; texte: string };

export type Projet = {
  reponses: Reponses;
  regles: Regle[];
  installeLe: string; // ISO
};

export type StatutProposition = "en_attente" | "validee" | "refusee" | "commentee";

export type Proposition = {
  id: string;
  equipe: string;
  titre: string;
  pourquoi: string;
  action: string; // ce qui partira exactement si l'on valide
  sources: { libelle: string; url: string }[];
  creeeLe: string;
  expireLe: string;
  statut: StatutProposition;
  commentaire?: string;
  exemple?: boolean;
};

export type LigneJournal = {
  id: string;
  equipe: string; // id d'équipe ou "pont"
  texte: string;
  le: string;
};

export type EtatEquipe = "travaille" | "attend" | "dort";
