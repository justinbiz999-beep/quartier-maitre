# Quartier-Maître

L'équipage d'agents IA de votre boutique en ligne. Les équipes préparent, vous validez : rien ne part sans vous.

Version de test (V1) : web app sur invitation, univers « Ma boutique en ligne », 20 e-commerçants.

## Ce qui existe aujourd'hui (semaine 1)

| Page | Adresse | État |
| --- | --- | --- |
| Accueil public et liste d'attente | `/` | Fait |
| Connexion (lien par email, Google) | `/connexion` | Fait, actif une fois Supabase branché |
| Installation : équipage, 5 questions, règles, outils | `/installation` | Fait (outils : semaine 3) |
| QG : carte, À valider, équipe, journal | `/qg` | Fait, avec des propositions d'exemple |
| Confidentialité (provisoire) | `/confidentialite` | Texte à compléter |

Sans réglages Supabase, l'app tourne en **mode démo** : données d'exemple, rien n'est enregistré en ligne.

## Mettre l'app en ligne (Vercel)

1. Sur [vercel.com](https://vercel.com), **Add New… > Project**, choisir ce dépôt GitHub, puis **Deploy**.
2. Vercel donne une adresse du type `quartier-maitre.vercel.app` : l'app y tourne en mode démo.
3. Chaque nouvel envoi sur GitHub met le site à jour tout seul.

## Brancher Supabase (fin du mode démo)

1. Dans Supabase, **SQL Editor > New query** : coller le contenu de `supabase/migrations/0001_init.sql`, puis **Run**.
2. **Authentication > URL Configuration** : mettre l'adresse Vercel dans *Site URL*, et ajouter `https://VOTRE-ADRESSE/auth/retour` dans *Redirect URLs*.
3. **Project Settings > API** : copier *Project URL* et la clé *anon public*.
4. Dans Vercel, **Settings > Environment Variables**, ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé anon public
   - `NEXT_PUBLIC_SITE_URL` = l'adresse du site
5. **Deployments > Redeploy**. Le bandeau « Mode démo » disparaît.

La clé *anon public* peut être visible dans le navigateur : la sécurité repose sur le cloisonnement des données (Row Level Security) défini dans le fichier SQL. La clé *service_role*, elle, ne doit jamais être collée nulle part sauf côté serveur.

## Structure

- `app/` : les pages
- `components/` : carte pixel, cartes de proposition, formulaires
- `lib/univers/boutique.ts` : les 5 équipes, leurs agents, rythmes et outils
- `lib/donnees.ts` : accès aux données (démo ou Supabase)
- `supabase/migrations/` : schéma de la base

## Développement local

```bash
npm install
npm run dev
```
