"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BandeauDemo } from "@/components/BandeauDemo";
import { CarteProposition } from "@/components/CarteProposition";
import { CarteQG, type InfoSalle } from "@/components/CarteQG";
import { Marque } from "@/components/Marque";
import { Portrait } from "@/components/Portrait";
import { MODE_DEMO } from "@/lib/config";
import { chargerEtat, decider, type Etat } from "@/lib/donnees";
import { reinitialiserDemo } from "@/lib/demo";
import { supabaseNavigateur } from "@/lib/supabase/client";
import type { StatutProposition } from "@/lib/types";
import { EQUIPES, PONT, equipeParId } from "@/lib/univers/boutique";

type Onglet = "valider" | "equipe" | "journal";

function heure(iso: string) {
  const d = new Date(iso);
  const auj = new Date();
  const memeJour = d.toDateString() === auj.toDateString();
  return memeJour
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function QG() {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("valider");
  const [selection, setSelection] = useState<string | null>(null);
  const [premier, setPremier] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setPremier(new URLSearchParams(window.location.search).get("premier") === "1");
    (async () => {
      if (!MODE_DEMO) {
        const { data } = await supabaseNavigateur()!.auth.getUser();
        if (!data.user) return router.replace("/connexion");
      }
      const e = await chargerEtat();
      if (!e.projet && !MODE_DEMO) return router.replace("/installation");
      setEtat(e);
    })().catch(() => setErreur("Le QG n'a pas pu se charger. Rechargez la page."));
  }, [router]);

  const infos = useMemo<Record<string, InfoSalle>>(() => {
    const res: Record<string, InfoSalle> = { pont: { etat: "travaille", enAttente: 0 } };
    for (const e of EQUIPES) {
      const enAttente = etat?.propositions.filter((p) => p.equipe === e.id && p.statut === "en_attente").length ?? 0;
      const derniere = etat?.journal.find((j) => j.equipe === e.id);
      const travaille = !!derniere?.texte.startsWith("Passage en cours");
      res[e.id] = { etat: enAttente > 0 ? "attend" : travaille ? "travaille" : "dort", enAttente };
    }
    return res;
  }, [etat]);

  const enAttente = etat?.propositions.filter((p) => p.statut === "en_attente") ?? [];
  const traitees = etat?.propositions.filter((p) => p.statut !== "en_attente") ?? [];
  const actives = Object.entries(infos).filter(([id, i]) => id !== "pont" && i.etat !== "dort").length;

  const onDecider = useCallback(async (id: string, statut: StatutProposition, commentaire?: string) => {
    try {
      setEtat(await decider(id, statut, commentaire));
      setErreur("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La décision n'est pas passée.");
    }
  }, []);

  function choisirSalle(id: string) {
    setSelection(id);
    setOnglet("equipe");
    if (window.innerWidth < 1024) document.getElementById("panneau")?.scrollIntoView({ behavior: "smooth" });
  }

  const equipe = selection && selection !== "pont" ? equipeParId(selection) : undefined;

  return (
    <>
      <BandeauDemo />
      <header className="border-b-2 border-encre bg-papier">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Marque href="/qg" />
          <dl className="m-0 grid grid-cols-4 gap-2 sm:gap-6">
            {[
              { n: enAttente.length, l: "à valider", fort: enAttente.length > 0 },
              { n: actives, l: "équipes actives" },
              { n: EQUIPES.reduce((s, e) => s + e.agents.length, 0) + 1, l: "agents" },
              { n: traitees.length, l: "décisions prises" },
            ].map((c) => (
              <div key={c.l} className="flex flex-col items-center text-center">
                <dd className={`m-0 font-pixel text-2xl font-bold ${c.fort ? "bg-bulle px-1.5" : ""}`}>{etat ? c.n : "…"}</dd>
                <dt className="text-[11px] leading-tight text-gris sm:text-xs">{c.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 pt-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="flex flex-col gap-4" aria-label="Carte du QG">
          {premier && (
            <div className="bloc flex flex-col gap-1 bg-bulle p-4" role="status">
              <p className="m-0 font-pixel text-lg font-bold">Votre équipage est à bord.</p>
              <p className="m-0 text-sm">
                Les équipes passent à leur rythme. Touchez une salle pour voir ce qu&apos;elle fait ; les bulles jaunes sont
                vos décisions en attente.
              </p>
            </div>
          )}
          <div className="bloc p-2 sm:p-3">
            <CarteQG infos={infos} selection={selection} onSelect={choisirSalle} />
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
            <li className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 border-2 border-encre bg-bulle" aria-hidden="true" /> Décision en attente
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 border-2 border-encre bg-ciel" aria-hidden="true" /> L&apos;équipe travaille
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 border-2 border-encre bg-[#5d5f68]" aria-hidden="true" /> En pause jusqu&apos;au
              prochain passage
            </li>
          </ul>
          {MODE_DEMO && (
            <button
              type="button"
              className="self-start bg-transparent p-0 text-sm text-gris underline"
              onClick={() => {
                reinitialiserDemo();
                window.location.href = "/qg";
              }}
            >
              Remettre la démo à zéro
            </button>
          )}
        </section>

        <section id="panneau" className="flex min-w-0 flex-col gap-4" aria-label="Panneau du QG">
          <div className="grid grid-cols-3 border-2 border-encre bg-papier" role="tablist">
            {(
              [
                ["valider", `À valider${enAttente.length ? ` (${enAttente.length})` : ""}`],
                ["equipe", "Équipe"],
                ["journal", "Journal"],
              ] as [Onglet, string][]
            ).map(([id, l]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={onglet === id}
                onClick={() => setOnglet(id)}
                className={`min-h-11 border-0 px-2 text-sm font-extrabold ${onglet === id ? "bg-encre text-creme" : "bg-transparent"}`}
              >
                {l}
              </button>
            ))}
          </div>

          {erreur && (
            <p className="bloc m-0 p-3 font-semibold text-alerte" role="alert">
              {erreur}
            </p>
          )}

          {onglet === "valider" && (
            <div className="flex flex-col gap-4" role="tabpanel">
              {!etat && <p className="m-0 text-gris">Chargement…</p>}
              {etat && enAttente.length === 0 && (
                <p className="bloc m-0 p-4">Aucune décision en attente. L&apos;équipage vous préviendra dès qu&apos;il a besoin de vous.</p>
              )}
              {enAttente.map((p) => (
                <CarteProposition key={p.id} p={p} onDecider={(s, c) => onDecider(p.id, s, c)} />
              ))}
              {traitees.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-bold">Décisions prises ({traitees.length})</summary>
                  <div className="mt-3 flex flex-col gap-3">
                    {traitees.map((p) => (
                      <CarteProposition key={p.id} p={p} onDecider={(s, c) => onDecider(p.id, s, c)} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {onglet === "equipe" && (
            <div className="flex flex-col gap-4" role="tabpanel">
              {!selection && <p className="bloc m-0 p-4">Touchez une salle sur la carte pour voir son équipe.</p>}
              {selection === "pont" && (
                <div className="bloc flex flex-col gap-3 p-4">
                  <h2 className="m-0 text-xl font-extrabold">{PONT.nom}</h2>
                  <div className="flex items-center gap-3">
                    <Portrait agent={PONT.agent} fond="#eadfc8" taille={48} />
                    <p className="m-0 leading-relaxed">{PONT.mission}</p>
                  </div>
                  <p className="m-0 text-sm text-gris">Point de la semaine : chaque lundi.</p>
                </div>
              )}
              {equipe && (
                <div className="bloc flex flex-col gap-4 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="m-0 text-xl font-extrabold">Équipe {equipe.nom}</h2>
                    <span className="border border-encre px-2 py-0.5 text-xs font-semibold" style={{ background: equipe.sol }}>
                      {infos[equipe.id]?.etat === "attend"
                        ? "Attend votre décision"
                        : infos[equipe.id]?.etat === "travaille"
                          ? "Au travail"
                          : "En pause"}
                    </span>
                  </div>
                  <p className="m-0 leading-relaxed">{equipe.mission}</p>
                  <dl className="m-0 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-bold">Rythme</dt>
                      <dd className="m-0">{equipe.rythme}</dd>
                    </div>
                    <div>
                      <dt className="font-bold">Outils</dt>
                      <dd className="m-0">{equipe.outils.join(", ")}</dd>
                    </div>
                  </dl>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {equipe.agents.map((a) => (
                      <li key={a.prenom} className="flex items-center gap-3">
                        <Portrait agent={a} fond={equipe.sol} />
                        <span>
                          <strong>{a.prenom}</strong> · {a.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <h3 className="m-0 text-sm font-bold">Dernières actions</h3>
                    <ul className="mt-2 flex flex-col gap-1 pl-5 text-sm">
                      {(etat?.journal.filter((j) => j.equipe === equipe.id).slice(0, 5) ?? []).map((j) => (
                        <li key={j.id}>
                          <span className="text-gris">{heure(j.le)}</span> · {j.texte}
                        </li>
                      ))}
                      {etat && !etat.journal.some((j) => j.equipe === equipe.id) && <li>Pas encore de passage.</li>}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn" disabled title="Disponible en semaine 2">
                      Lancer maintenant
                    </button>
                    <button type="button" className="btn" disabled title="Disponible en semaine 4">
                      Parler à l&apos;équipe
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {onglet === "journal" && (
            <ol className="bloc m-0 flex list-none flex-col p-0" role="tabpanel">
              {(etat?.journal ?? []).map((j) => {
                const eq = j.equipe === "pont" ? { nom: "Pont", sol: "#eadfc8" } : equipeParId(j.equipe);
                return (
                  <li key={j.id} className="flex gap-3 border-b border-trait px-4 py-3 text-sm last:border-b-0">
                    <time className="w-12 shrink-0 text-gris" dateTime={j.le}>
                      {heure(j.le)}
                    </time>
                    <span>
                      <span className="mr-2 border border-encre px-1.5 text-xs font-semibold" style={{ background: eq?.sol }}>
                        {eq?.nom}
                      </span>
                      {j.texte}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>

      {enAttente.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t-2 border-encre bg-creme p-3 lg:hidden">
          <button
            type="button"
            className="btn btn-jaune w-full"
            onClick={() => {
              setOnglet("valider");
              document.getElementById("panneau")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            À valider ({enAttente.length})
          </button>
        </div>
      )}
    </>
  );
}
