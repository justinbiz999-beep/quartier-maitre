"use client";

import { useState } from "react";
import type { Proposition, StatutProposition } from "@/lib/types";
import { equipeParId } from "@/lib/univers/boutique";

const LIBELLES: Record<StatutProposition, string> = {
  en_attente: "En attente",
  validee: "Validé",
  refusee: "Refusé",
  commentee: "Commenté",
};

function delai(iso: string) {
  const jours = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000);
  return jours <= 1 ? "expire demain" : `expire dans ${jours} jours`;
}

export function CarteProposition({
  p,
  onDecider,
}: {
  p: Proposition;
  onDecider: (statut: StatutProposition, commentaire?: string) => Promise<void>;
}) {
  const [ouverte, setOuverte] = useState(false);
  const [commenter, setCommenter] = useState(false);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const equipe = equipeParId(p.equipe);
  const enAttente = p.statut === "en_attente";

  async function decider(statut: StatutProposition, commentaire?: string) {
    setEnvoi(true);
    try {
      await onDecider(statut, commentaire);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <article className={`bloc flex flex-col gap-3 p-4 ${enAttente ? "" : "opacity-75"}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="border border-encre px-2 py-0.5" style={{ background: equipe?.sol }}>
          {equipe?.nom ?? p.equipe}
        </span>
        {p.exemple && <span className="border border-dashed border-encre px-2 py-0.5">Exemple</span>}
        <span className="ml-auto text-gris">{enAttente ? delai(p.expireLe) : LIBELLES[p.statut]}</span>
      </div>
      <h3 className="m-0 text-lg font-extrabold leading-snug">{p.titre}</h3>

      <div className="border-l-4 border-bulle bg-creme px-3 py-2">
        <p className="m-0 text-xs font-bold tracking-wide text-gris">SI VOUS VALIDEZ</p>
        <p className="m-0 mt-1 text-sm leading-relaxed">{p.action}</p>
      </div>

      <button
        type="button"
        className="self-start bg-transparent p-0 text-sm font-bold underline"
        onClick={() => setOuverte((o) => !o)}
        aria-expanded={ouverte}
      >
        {ouverte ? "Masquer le détail" : "Pourquoi cette proposition ?"}
      </button>
      {ouverte && (
        <div className="flex flex-col gap-2 text-sm leading-relaxed">
          <p className="m-0">{p.pourquoi}</p>
          {p.sources.length > 0 && (
            <ul className="m-0 pl-5">
              {p.sources.map((s) => (
                <li key={s.url + s.libelle}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-encre underline">
                    {s.libelle}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {p.commentaire && !enAttente && <p className="m-0 text-sm italic text-gris">Votre commentaire : « {p.commentaire} »</p>}

      {enAttente && !commenter && (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="btn btn-principal px-2" disabled={envoi} onClick={() => decider("validee")}>
            Valider
          </button>
          <button type="button" className="btn px-2" disabled={envoi} onClick={() => decider("refusee")}>
            Refuser
          </button>
          <button type="button" className="btn px-2" disabled={envoi} onClick={() => setCommenter(true)}>
            Commenter
          </button>
        </div>
      )}
      {enAttente && commenter && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (texte.trim()) decider("commentee", texte.trim());
          }}
        >
          <label htmlFor={`c-${p.id}`} className="text-sm font-bold">
            Votre commentaire pour l&apos;équipe {equipe?.nom}
          </label>
          <textarea
            id={`c-${p.id}`}
            rows={2}
            className="champ"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Plutôt -10 % que -15 %, et seulement le week-end"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-principal" disabled={envoi || !texte.trim()}>
              Envoyer
            </button>
            <button type="button" className="btn" onClick={() => setCommenter(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
