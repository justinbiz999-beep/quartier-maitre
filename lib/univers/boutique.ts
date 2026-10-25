// Univers « Ma boutique en ligne » : le seul univers de la V1 de test.
// La carte, l'installation et le QG se construisent à partir de cette liste :
// ajouter un univers plus tard = écrire un fichier comme celui-ci, pas redessiner l'app.

export type Agent = {
  prenom: string;
  role: string;
  cheveux: string;
  peau: string;
  haut: string;
};

export type Equipe = {
  id: string;
  nom: string;
  mission: string;
  rythme: string;
  outils: string[];
  exemple: string;
  sol: string;
  /** Position de la salle sur la grille de la carte (colonnes 0-2, lignes 0-1). */
  col: number;
  ligne: number;
  agents: Agent[];
};

export const PONT = {
  nom: "Le pont",
  mission:
    "Le quartier-maître coordonne l'équipage : il répartit le travail, rassemble les propositions et vous fait le point du lundi.",
  agent: { prenom: "Le quartier-maître", role: "Coordination", cheveux: "#2b1d14", peau: "#e9b98f", haut: "#1f2433" } as Agent,
};

export const EQUIPES: Equipe[] = [
  {
    id: "etudes",
    nom: "Études",
    mission: "Trouver et mesurer de nouvelles niches : volumes de recherche, concurrence, prix du marché.",
    rythme: "Chaque mardi",
    outils: ["Recherche web"],
    exemple: "3 niches mesurées, une passe vos critères : on l'ajoute au radar ?",
    sol: "#9fd3e6",
    col: 0,
    ligne: 0,
    agents: [
      { prenom: "Octave", role: "Chasseur de niches", cheveux: "#3b2a1e", peau: "#f1c8a0", haut: "#3a6ea5" },
      { prenom: "Lina", role: "Analyste mots-clés", cheveux: "#1e1a17", peau: "#c98f63", haut: "#d9822b" },
    ],
  },
  {
    id: "veille",
    nom: "Veille",
    mission: "Suivre vos concurrents : prix, promotions, nouveaux produits, avis clients.",
    rythme: "Chaque lundi",
    outils: ["Recherche web"],
    exemple: "Votre concurrent a baissé son prix de 15 % : on ajuste ?",
    sol: "#f4b6a0",
    col: 1,
    ligne: 0,
    agents: [
      { prenom: "Hugo", role: "Veilleur prix", cheveux: "#a35a2a", peau: "#f3cfb0", haut: "#4f7d4a" },
      { prenom: "Maëlle", role: "Veilleuse tendances", cheveux: "#5a3a22", peau: "#e8b48c", haut: "#8a4f9e" },
    ],
  },
  {
    id: "creation",
    nom: "Création",
    mission: "Rédiger et améliorer vos fiches produits, vos textes et vos visuels.",
    rythme: "Sur demande",
    outils: ["Shopify"],
    exemple: "Fiche produit réécrite, prête à passer en brouillon dans Shopify.",
    sol: "#f2d27a",
    col: 2,
    ligne: 0,
    agents: [
      { prenom: "Inès", role: "Rédactrice", cheveux: "#7a4b2a", peau: "#f1c8a0", haut: "#c0504d" },
      { prenom: "Sacha", role: "Visuels", cheveux: "#d9b26f", peau: "#f6d7bb", haut: "#2f6f73" },
    ],
  },
  {
    id: "sav",
    nom: "SAV",
    mission: "Préparer les réponses à vos clients : suivi de commande, retours, questions produit.",
    rythme: "Chaque jour",
    outils: ["Gmail"],
    exemple: "4 réponses clients prêtes à envoyer.",
    sol: "#b9e0b0",
    col: 0,
    ligne: 1,
    agents: [
      { prenom: "Léon", role: "Conseiller clients", cheveux: "#2b2b2b", peau: "#8d5b3e", haut: "#5b6bb5" },
      { prenom: "Nora", role: "Retours et litiges", cheveux: "#4a2f1d", peau: "#e2a878", haut: "#b5455b" },
    ],
  },
  {
    id: "finance",
    nom: "Finance",
    mission: "Calculer votre marge réelle après TVA et URSSAF, repérer les produits à surveiller.",
    rythme: "Chaque vendredi",
    outils: ["Shopify"],
    exemple: "Marge réelle de la semaine après TVA et URSSAF : 2 produits à surveiller.",
    sol: "#d9c8f0",
    col: 2,
    ligne: 1,
    agents: [
      { prenom: "Bastien", role: "Contrôleur de marge", cheveux: "#6b4226", peau: "#f1c8a0", haut: "#3c4a5c" },
      { prenom: "Camille", role: "TVA et URSSAF", cheveux: "#1e1a17", peau: "#b97a52", haut: "#a8743a" },
    ],
  },
];

export function equipeParId(id: string): Equipe | undefined {
  return EQUIPES.find((e) => e.id === id);
}
