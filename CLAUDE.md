# Quartier-Maître · consignes du dépôt

- Les porteurs du projet ne codent pas : expliquer chaque changement en français simple, sans jargon.
- Tout le texte visible est en français, vouvoiement pour l'utilisateur final.
- Règle produit non négociable : les agents proposent, seul un code sans IA exécute, et seulement après validation (`decider_proposition` côté base). Aucune action qui dépense de l'argent en V1.
- Jamais de secret dans le dépôt : les clés vont dans les variables d'environnement Vercel.
- Le mode démo (sans variables Supabase) doit toujours fonctionner.
- Avant tout envoi : `npm run typecheck` puis `npm run build`.
- Pile : Next.js 15 (App Router), React 19, Tailwind 4, Supabase (`@supabase/ssr`).
