"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BandeauDemo } from "@/components/BandeauDemo";
import { Marque } from "@/components/Marque";
import { Portrait } from "@/components/Portrait";
import { MODE_DEMO } from "@/lib/config";
import { enregistrerProjet } from "@/lib/donnees";
import { reglesDepuisReponses } from "@/lib/regles";
import { supabaseNavigateur } from "@/lib/supabase/client";
import type { Regle, Reponses } from "@/lib/types";
import { EQUIPES, PONT } from "@/lib/univers/boutique";

const VIDE: Reponses = { boutique: "", budget: "", objectif: "", refus: "", priorite: "veille" };
const NB_ETAPES = 8;

export default function Installation() {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
  const [rep, setRep] = useState<Reponses>(VIDE);
  const [regles, setRegles] = useState<Regle[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  // En mode réel, il faut être connecté.
  useEffect(() => {
    if (MODE_DEMO) return;
    supabaseNavigateur()!
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) router.replace("/connexion");
      });
  }, [router]);

  const maj = (champ: keyof Reponses, valeur: string) => setRep((r) => ({ ...r, [champ]: valeur }));

  function suivant() {
    if (etape === 5) setRegles(reglesDepuisReponses(rep));
    setEtape((e) => Math.min(e + 1, NB_ETAPES - 1));
    window.scrollTo({ top: 0 });
  }
  function precedent() {
    setEtape((e) => Math.max(e - 1, 0));
    window.scrollTo({ top: 0 });
  }

  async function lancer() {
    setEnvoi(true);
    setErreur("");
    try {
      await enregistrerProjet({
        reponses: rep,
        regles: regles.filter((r) => r.texte.trim()),
        installeLe: new Date().toISOString(),
      });
      router.push("/qg?premier=1");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
      setEnvoi(false);
    }
  }

  const peutContinuer = useMemo(() => {
    if (etape === 1) return rep.boutique.trim().length > 2;
    if (etape === 2) return rep.budget.trim().length > 0;
    if (etape === 3) return rep.objectif.trim().length > 2;
    return true;
  }, [etape, rep]);

  return (
    <>
      <BandeauDemo />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Marque />
        <span className="font-pixel text-sm text-gris" aria-live="polite">
          Étape {etape + 1} sur {NB_ETAPES}
        </span>
      </header>
      <div className="mx-auto max-w-3xl px-4">
        <div className="h-3 border-2 border-encre bg-papier" aria-hidden="true">
          <div className="h-full bg-valide transition-all" style={{ width: `${((etape + 1) / NB_ETAPES) * 100}%` }} />
        </div>
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-28 pt-8">
        {etape === 0 && (
          <section className="flex flex-col gap-5">
            <h1 className="m-0 text-3xl font-extrabold">Voici l&apos;équipage de votre boutique</h1>
            <p className="m-0 text-lg leading-relaxed">
              Cinq équipes vont travailler pour vous, chacune à son rythme. Elles préparent ; vous décidez.
            </p>
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
              {EQUIPES.map((e) => (
                <li key={e.id} className="bloc flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="m-0 text-lg font-extrabold">{e.nom}</h2>
                    <span className="border border-encre px-2 py-0.5 text-xs font-semibold" style={{ background: e.sol }}>
                      {e.rythme}
                    </span>
                  </div>
                  <p className="m-0 leading-relaxed">{e.mission}</p>
                  <div className="flex gap-3">
                    {e.agents.map((a) => (
                      <div key={a.prenom} className="flex items-center gap-2">
                        <Portrait agent={a} fond={e.sol} />
                        <span className="text-sm leading-tight">
                          <strong>{a.prenom}</strong>
                          <br />
                          <span className="text-gris">{a.role}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
              <li className="bloc flex flex-col gap-3 bg-encre p-4 text-creme">
                <h2 className="m-0 text-lg font-extrabold">{PONT.nom}</h2>
                <p className="m-0 leading-relaxed">{PONT.mission}</p>
              </li>
            </ul>
            <p className="m-0 text-gris">Pour bien travailler, l&apos;équipage a besoin de vous connaître : 5 questions, 2 minutes.</p>
          </section>
        )}

        {etape === 1 && (
          <Question
            n={1}
            titre="Parlez-nous de votre boutique"
            aide="Ce que vous vendez, à qui, et sur quelle plateforme."
          >
            <textarea
              id="q"
              rows={4}
              className="champ"
              value={rep.boutique}
              onChange={(e) => maj("boutique", e.target.value)}
              placeholder="Arbres à chat robustes pour grands chats, vendus sur Shopify, lancement en novembre"
            />
          </Question>
        )}

        {etape === 2 && (
          <Question
            n={2}
            titre="Quel budget mensuel maximum ?"
            aide="Pour la publicité et les outils. L'équipage ne proposera jamais de le dépasser."
          >
            <input id="q" className="champ" value={rep.budget} onChange={(e) => maj("budget", e.target.value)} placeholder="300 €" />
            <Puces valeurs={["100 €", "300 €", "500 €", "1 000 €"]} actif={rep.budget} onChoix={(v) => maj("budget", v)} />
          </Question>
        )}

        {etape === 3 && (
          <Question n={3} titre="Votre objectif pour les 3 prochains mois ?" aide="Les propositions devront vous en rapprocher.">
            <input id="q" className="champ" value={rep.objectif} onChange={(e) => maj("objectif", e.target.value)} />
            <Puces
              valeurs={["Faire mes premières ventes", "Atteindre 1 000 € de ventes par mois", "Gagner du temps sur le SAV", "Améliorer ma marge"]}
              actif={rep.objectif}
              onChoix={(v) => maj("objectif", v)}
            />
          </Question>
        )}

        {etape === 4 && (
          <Question
            n={4}
            titre="Ce que vous refusez de faire"
            aide="Une idée par ligne. Facultatif, mais c'est ce qui rend l'équipage vraiment à votre image."
          >
            <textarea
              id="q"
              rows={4}
              className="champ"
              value={rep.refus}
              onChange={(e) => maj("refus", e.target.value)}
              placeholder={"Pas de promotion de plus de 20 %\nJamais de produits pour enfants\nPas de publicité sur TikTok"}
            />
          </Question>
        )}

        {etape === 5 && (
          <Question n={5} titre="Par quoi commencer ?" aide="L'équipe choisie fera son premier passage dès la fin de l'installation.">
            <fieldset className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-2">
              <legend className="sr-only">Équipe prioritaire</legend>
              {EQUIPES.map((e) => (
                <label
                  key={e.id}
                  className={`bloc flex cursor-pointer items-start gap-3 p-4 ${rep.priorite === e.id ? "bg-bulle" : ""}`}
                >
                  <input
                    type="radio"
                    name="priorite"
                    value={e.id}
                    checked={rep.priorite === e.id}
                    onChange={() => maj("priorite", e.id)}
                    className="mt-1 h-5 w-5 accent-encre"
                  />
                  <span>
                    <strong>{e.nom}</strong>
                    <br />
                    <span className="text-sm">{e.mission}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Question>
        )}

        {etape === 6 && (
          <section className="flex flex-col gap-4">
            <h1 className="m-0 text-3xl font-extrabold">Les règles de votre équipage</h1>
            <p className="m-0 leading-relaxed">
              Voici ce que les équipes liront avant chaque passage. Corrigez, supprimez ou ajoutez ce que vous voulez.
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {regles.map((r, i) => (
                <li key={r.id} className="flex items-center gap-2">
                  <label htmlFor={r.id} className="sr-only">
                    Règle {i + 1}
                  </label>
                  <input
                    id={r.id}
                    className="champ"
                    value={r.texte}
                    disabled={i === 0}
                    onChange={(e) => setRegles((l) => l.map((x) => (x.id === r.id ? { ...x, texte: e.target.value } : x)))}
                  />
                  {i === 0 ? (
                    <span className="w-24 shrink-0 text-xs font-semibold text-gris">Toujours active</span>
                  ) : (
                    <button
                      type="button"
                      className="btn w-24 shrink-0 px-2"
                      onClick={() => setRegles((l) => l.filter((x) => x.id !== r.id))}
                      aria-label={`Supprimer la règle ${i + 1}`}
                    >
                      Retirer
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn self-start"
              onClick={() => setRegles((l) => [...l, { id: `r${Date.now()}`, texte: "" }])}
            >
              Ajouter une règle
            </button>
          </section>
        )}

        {etape === 7 && (
          <section className="flex flex-col gap-4">
            <h1 className="m-0 text-3xl font-extrabold">Brancher vos outils</h1>
            <p className="m-0 leading-relaxed">
              Les équipes Études et Veille travaillent déjà avec la recherche web. Les autres auront besoin de vos outils ;
              chaque équipe ne voit que ce dont elle a besoin.
            </p>
            <ul className="m-0 grid list-none gap-3 p-0">
              {[
                { nom: "Gmail", usage: "SAV : envoyer les réponses que vous validez, depuis votre adresse.", acces: "Envoi seulement, jamais de lecture de votre boîte" },
                { nom: "Google Agenda", usage: "Ajouter les échéances que vous validez.", acces: "Création d'événements" },
                { nom: "Shopify", usage: "Création et Finance : fiches en brouillon, ventes de la semaine.", acces: "Brouillons et lecture des ventes" },
              ].map((o) => (
                <li key={o.nom} className="bloc flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="max-w-md">
                    <strong>{o.nom}</strong>
                    <br />
                    <span className="text-sm">{o.usage}</span>
                    <br />
                    <span className="text-xs text-gris">{o.acces}</span>
                  </span>
                  <button type="button" className="btn" disabled>
                    Bientôt disponible
                  </button>
                </li>
              ))}
            </ul>
            <p className="m-0 text-sm text-gris">Vous pourrez les brancher plus tard depuis les réglages.</p>
            {erreur && (
              <p className="m-0 font-semibold text-alerte" role="alert">
                {erreur}
              </p>
            )}
          </section>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t-2 border-encre bg-creme" aria-label="Navigation de l'installation">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" className="btn" onClick={precedent} disabled={etape === 0}>
            Retour
          </button>
          {etape < NB_ETAPES - 1 ? (
            <button type="button" className="btn btn-principal" onClick={suivant} disabled={!peutContinuer}>
              {etape === 0 ? "C'est parti" : "Continuer"}
            </button>
          ) : (
            <button type="button" className="btn btn-jaune" onClick={lancer} disabled={envoi}>
              {envoi ? "Installation…" : "Lancer mon équipage"}
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

function Question({ n, titre, aide, children }: { n: number; titre: string; aide: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <p className="m-0 font-pixel text-sm tracking-[0.2em] text-gris">QUESTION {n} SUR 5</p>
      <label htmlFor="q" className="text-3xl font-extrabold leading-tight">
        {titre}
      </label>
      <p className="m-0 leading-relaxed text-gris">{aide}</p>
      {children}
    </section>
  );
}

function Puces({ valeurs, actif, onChoix }: { valeurs: string[]; actif: string; onChoix: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {valeurs.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChoix(v)}
          aria-pressed={actif === v}
          className={`btn min-h-10 px-3 text-sm ${actif === v ? "btn-jaune" : ""}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
