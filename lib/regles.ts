import type { Regle, Reponses } from "@/lib/types";
import { equipeParId } from "@/lib/univers/boutique";

/**
 * Transforme les 5 réponses en règles lisibles que les agents liront à chaque passage.
 * Volontairement simple et sans IA : le testeur les voit, les corrige ou les supprime.
 */
export function reglesDepuisReponses(r: Reponses): Regle[] {
  const regles: string[] = [];

  regles.push("Rien n'est publié, envoyé ou dépensé sans ma validation.");

  if (r.boutique.trim()) regles.push(`Ma boutique : ${r.boutique.trim()}.`);

  const budget = r.budget.trim();
  if (budget) regles.push(`Ne jamais proposer de dépense qui ferait dépasser ${budget} par mois.`);

  if (r.objectif.trim()) regles.push(`Mon objectif : ${r.objectif.trim()}. Les propositions doivent y contribuer.`);

  r.refus
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => regles.push(`Refus : ${s}.`));

  const prio = equipeParId(r.priorite);
  if (prio) regles.push(`Priorité du moment : l'équipe ${prio.nom}.`);

  regles.push("Toujours citer ses sources et montrer les chiffres.");

  return regles.map((texte, i) => ({ id: `r${i + 1}`, texte }));
}
