-- Quartier-Maître · schéma initial (V1 de test)
-- À coller dans Supabase > SQL Editor > New query, puis Run. Une seule fois.
--
-- Principe de sécurité :
--   * chaque table est cloisonnée par utilisateur (Row Level Security) ;
--   * un utilisateur ne modifie jamais directement une proposition : il passe par
--     decider_proposition(), qui n'accepte qu'une décision sur une proposition en attente et non expirée ;
--   * les accès Google / Shopify (table connexions) ne sont jamais lisibles depuis le navigateur :
--     seul le serveur, avec la clé service, y accède.

-- 1. Projet de l'utilisateur : réponses aux 5 questions et règles
create table public.projets (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  univers     text not null default 'boutique',
  reponses    jsonb not null default '{}'::jsonb,
  regles      jsonb not null default '[]'::jsonb,
  installe_le timestamptz not null default now(),
  maj_le      timestamptz not null default now()
);

-- 2. Réglages de chaque équipe (actif, rythme, prochain passage)
create table public.equipes (
  user_id          uuid not null references auth.users (id) on delete cascade,
  equipe           text not null,
  active           boolean not null default true,
  rythme           text not null,
  prochain_passage timestamptz,
  primary key (user_id, equipe)
);

-- 3. Propositions à valider
create table public.propositions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  equipe       text not null,
  titre        text not null,
  pourquoi     text not null,
  action_type  text not null,                 -- ex. 'email', 'shopify_brouillon', 'agenda', 'aucune'
  action       jsonb not null default '{}'::jsonb, -- contenu exact exécuté après validation
  action_texte text not null,                 -- aperçu lisible de ce qui partira
  sources      jsonb not null default '[]'::jsonb,
  avertissements jsonb not null default '[]'::jsonb,
  statut       text not null default 'en_attente'
               check (statut in ('en_attente', 'validee', 'refusee', 'commentee', 'expiree', 'executee', 'echec')),
  commentaire  text,
  decide_le    timestamptz,
  execute_le   timestamptz,
  cree_le      timestamptz not null default now(),
  expire_le    timestamptz not null default now() + interval '7 days'
);
create index propositions_user_statut on public.propositions (user_id, statut, cree_le desc);

-- 4. Journal de tout ce qui se passe
create table public.journal (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  equipe  text not null,
  texte   text not null,
  le      timestamptz not null default now()
);
create index journal_user_le on public.journal (user_id, le desc);

-- 5. Consommation IA (pour le plafond de 5 € par testeur et par mois)
create table public.consommation (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  equipe      text not null,
  modele      text not null,
  jetons_lus  integer not null default 0,
  jetons_ecrits integer not null default 0,
  recherches  integer not null default 0,
  cout_eur    numeric(10, 4) not null default 0,
  le          timestamptz not null default now()
);
create index consommation_user_le on public.consommation (user_id, le desc);

-- 6. Outils branchés (Gmail, Agenda, Shopify) : clés chiffrées, invisibles depuis le navigateur
create table public.connexions (
  user_id     uuid not null references auth.users (id) on delete cascade,
  service     text not null check (service in ('gmail', 'agenda', 'shopify')),
  cle_chiffree text not null,
  portee      text not null,
  branche_le  timestamptz not null default now(),
  primary key (user_id, service)
);

-- 7. Liste d'attente de la page d'accueil (écriture seule, depuis le formulaire public)
create table public.liste_attente (
  id         bigint generated always as identity primary key,
  email      text not null check (position('@' in email) > 1 and length(email) <= 254),
  plateforme text check (length(plateforme) <= 60),
  perte_de_temps text check (length(perte_de_temps) <= 500),
  cree_le    timestamptz not null default now()
);
create unique index liste_attente_email on public.liste_attente (lower(email));

-- Cloisonnement
alter table public.liste_attente enable row level security;
create policy "s'inscrire sur la liste" on public.liste_attente for insert to anon, authenticated with check (true);
-- aucune lecture possible depuis le navigateur : seuls vous deux la consultez dans Supabase.

alter table public.projets      enable row level security;
alter table public.equipes      enable row level security;
alter table public.propositions enable row level security;
alter table public.journal      enable row level security;
alter table public.consommation enable row level security;
alter table public.connexions   enable row level security;

create policy "lire son projet"        on public.projets      for select using (auth.uid() = user_id);
create policy "lire ses equipes"       on public.equipes      for select using (auth.uid() = user_id);
create policy "changer ses equipes"    on public.equipes      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lire ses propositions"  on public.propositions for select using (auth.uid() = user_id);
create policy "lire son journal"       on public.journal      for select using (auth.uid() = user_id);
create policy "lire sa consommation"   on public.consommation for select using (auth.uid() = user_id);
-- connexions : aucune politique pour les utilisateurs => illisible depuis le navigateur.

-- Installer (ou réinstaller) son projet : réponses, règles, équipes par défaut, ligne de journal
create or replace function public.installer_projet(p_reponses jsonb, p_regles jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'non connecté';
  end if;

  insert into projets (user_id, reponses, regles)
  values (uid, p_reponses, p_regles)
  on conflict (user_id) do update set reponses = excluded.reponses, regles = excluded.regles, maj_le = now();

  insert into equipes (user_id, equipe, rythme) values
    (uid, 'etudes',   'Chaque mardi'),
    (uid, 'veille',   'Chaque lundi'),
    (uid, 'creation', 'Sur demande'),
    (uid, 'sav',      'Chaque jour'),
    (uid, 'finance',  'Chaque vendredi')
  on conflict do nothing;

  insert into journal (user_id, equipe, texte)
  values (uid, 'pont', 'Équipage installé. Les règles sont transmises à toutes les équipes.');
end;
$$;

-- Décider d'une proposition : seule voie pour la modifier depuis l'app
create or replace function public.decider_proposition(p_id uuid, p_statut text, p_commentaire text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p propositions%rowtype;
begin
  if uid is null then
    raise exception 'non connecté';
  end if;
  if p_statut not in ('validee', 'refusee', 'commentee') then
    raise exception 'décision inconnue';
  end if;

  select * into p from propositions where id = p_id and user_id = uid for update;
  if not found then
    raise exception 'proposition introuvable';
  end if;
  if p.statut <> 'en_attente' then
    raise exception 'proposition déjà traitée';
  end if;
  if p.expire_le < now() then
    update propositions set statut = 'expiree' where id = p_id;
    raise exception 'proposition expirée';
  end if;

  update propositions
     set statut = p_statut, commentaire = p_commentaire, decide_le = now()
   where id = p_id;

  insert into journal (user_id, equipe, texte)
  values (uid, p.equipe,
          case p_statut
            when 'validee'   then 'Validé : « ' || p.titre || ' ».'
            when 'refusee'   then 'Refusé : « ' || p.titre || ' ».'
            else                  'Commenté : « ' || p.titre || ' ». L''équipe revoit sa copie au prochain passage.'
          end);
end;
$$;

revoke all on function public.installer_projet(jsonb, jsonb) from public, anon;
revoke all on function public.decider_proposition(uuid, text, text) from public, anon;
grant execute on function public.installer_projet(jsonb, jsonb) to authenticated;
grant execute on function public.decider_proposition(uuid, text, text) to authenticated;
