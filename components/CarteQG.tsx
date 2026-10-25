"use client";

import { useEffect, useRef, useState } from "react";
import { EQUIPES, PONT, type Agent } from "@/lib/univers/boutique";
import type { EtatEquipe } from "@/lib/types";

// La carte est dessinée en petits pixels (200 × 123) puis agrandie sans flou.
// Les noms, bulles et zones cliquables sont du vrai HTML par-dessus : lisibles et accessibles.

const W = 200;
const H = 123;
const ZOOM = 4;
const SALLE_L = 60;
const SALLE_H = 54;

type Salle = { id: string; nom: string; sol: string; col: number; ligne: number; agents: Agent[] };

const SALLES: Salle[] = [
  ...EQUIPES.map((e) => ({ id: e.id, nom: e.nom, sol: e.sol, col: e.col, ligne: e.ligne, agents: e.agents })),
  { id: "pont", nom: PONT.nom, sol: "#eadfc8", col: 1, ligne: 1, agents: [PONT.agent] },
];

function origine(s: Salle) {
  return { x: 5 + s.col * (SALLE_L + 5), y: 5 + s.ligne * (SALLE_H + 5) };
}

export type InfoSalle = { etat: EtatEquipe; enAttente: number; prochain?: string };

type Props = {
  infos: Record<string, InfoSalle>;
  selection?: string | null;
  onSelect?: (id: string) => void;
  /** Version vitrine (page d'accueil) : pas de clic. */
  decor?: boolean;
};

export function CarteQG({ infos, selection, onSelect, decor = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState(0);

  useEffect(() => {
    const calme = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (calme) return;
    const t = window.setInterval(() => setImage((i) => (i + 1) % 4), 450);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.setTransform(ZOOM, 0, 0, ZOOM, 0, 0);
    ctx.imageSmoothingEnabled = false;
    dessiner(ctx, infos, image);
  }, [infos, image]);

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas
        ref={canvas}
        width={W * ZOOM}
        height={H * ZOOM}
        className="pixelise absolute inset-0 h-full w-full border-2 border-encre"
        role="img"
        aria-label="Carte du QG : le pont au centre, entouré des salles des cinq équipes"
      />
      {SALLES.map((s) => {
        const { x, y } = origine(s);
        const info = infos[s.id] ?? { etat: "dort" as EtatEquipe, enAttente: 0 };
        const choisie = selection === s.id;
        const libelle =
          s.id === "pont"
            ? "Le pont : le quartier-maître"
            : `Équipe ${s.nom} : ${
                info.enAttente > 0
                  ? `${info.enAttente} décision${info.enAttente > 1 ? "s" : ""} en attente`
                  : info.etat === "travaille"
                    ? "travaille"
                    : "en pause jusqu'au prochain passage"
              }`;
        const style = {
          left: `${(x / W) * 100}%`,
          top: `${(y / H) * 100}%`,
          width: `${(SALLE_L / W) * 100}%`,
          height: `${(SALLE_H / H) * 100}%`,
        };
        const contenu = (
          <>
            <span className="absolute left-1 top-1 border border-encre bg-papier px-1 font-pixel text-[11px] leading-4 sm:text-xs">
              {s.nom}
            </span>
            {info.enAttente > 0 && (
              <span className="absolute -right-1.5 -top-2 flex h-6 min-w-6 items-center justify-center border-2 border-encre bg-bulle px-1 font-pixel text-xs font-bold shadow-[2px_2px_0_#1f2433]">
                {info.enAttente}
              </span>
            )}
            {info.etat === "dort" && info.enAttente === 0 && s.id !== "pont" && (
              <span className="absolute bottom-1 right-1 font-pixel text-[10px] text-papier sm:text-xs">zZ</span>
            )}
          </>
        );
        return decor ? (
          <div key={s.id} className="absolute" style={style} aria-hidden="true">
            {contenu}
          </div>
        ) : (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect?.(s.id)}
            aria-label={libelle}
            aria-pressed={choisie}
            className={`absolute cursor-pointer bg-transparent p-0 ${
              choisie ? "outline-[3px] outline-offset-0 outline-bulle" : "hover:outline-2 hover:outline-encre/60"
            }`}
            style={style}
          >
            {contenu}
          </button>
        );
      })}
    </div>
  );
}

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, couleur: string) {
  ctx.fillStyle = couleur;
  ctx.fillRect(x, y, w, h);
}

function eclaircir(hex: string, delta: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + delta));
  const rr = c((n >> 16) & 255);
  const gg = c((n >> 8) & 255);
  const bb = c(n & 255);
  return `rgb(${rr},${gg},${bb})`;
}

function dessiner(ctx: CanvasRenderingContext2D, infos: Record<string, InfoSalle>, image: number) {
  // Le pont du navire : planches
  r(ctx, 0, 0, W, H, "#b89a6a");
  for (let y = 0; y < H; y += 4) r(ctx, 0, y, W, 1, "#a8895b");
  for (let y = 0; y < H; y += 4) {
    const decal = (y / 4) % 2 === 0 ? 0 : 13;
    for (let x = decal; x < W; x += 26) r(ctx, x, y, 1, 4, "#a8895b");
  }

  for (const s of SALLES) {
    const { x, y } = origine(s);
    const info = infos[s.id] ?? { etat: "dort" as EtatEquipe, enAttente: 0 };
    const travaille = info.etat === "travaille";

    // Sol en damier léger
    for (let ty = 0; ty < SALLE_H; ty += 6) {
      for (let tx = 0; tx < SALLE_L; tx += 6) {
        const pair = ((tx + ty) / 6) % 2 === 0;
        r(ctx, x + tx, y + ty, 6, 6, pair ? s.sol : eclaircir(s.sol, -10));
      }
    }
    // Mur du fond
    r(ctx, x, y, SALLE_L, 10, "#e9e1cf");
    r(ctx, x, y + 10, SALLE_L, 1, "#c4b89f");
    // Hublot
    r(ctx, x + SALLE_L - 13, y + 2, 7, 6, "#1f2433");
    r(ctx, x + SALLE_L - 12, y + 3, 5, 4, travaille ? "#cdeaf3" : "#9fd3e6");

    if (s.id === "pont") {
      dessinerPont(ctx, x, y, s.agents[0], image);
    } else {
      s.agents.forEach((a, i) => {
        const bx = x + 6 + i * 28;
        const by = y + 32;
        const saut = travaille && (image + i) % 2 === 0 ? -1 : 0;
        personnage(ctx, bx + 1, by - 10 + saut, a);
        bureau(ctx, bx, by, travaille, image + i);
      });
    }

    // Contour
    ctx.strokeStyle = "#1f2433";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, SALLE_L - 1, SALLE_H - 1);

    // Équipe en pause : lumière tamisée
    if (info.etat === "dort" && info.enAttente === 0 && s.id !== "pont") {
      ctx.fillStyle = "rgba(31,36,51,0.35)";
      ctx.fillRect(x + 1, y + 1, SALLE_L - 2, SALLE_H - 2);
    }
  }
}

function personnage(ctx: CanvasRenderingContext2D, x: number, y: number, a: Agent) {
  r(ctx, x + 1, y, 6, 2, a.cheveux);
  r(ctx, x, y + 1, 1, 3, a.cheveux);
  r(ctx, x + 7, y + 1, 1, 2, a.cheveux);
  r(ctx, x + 1, y + 2, 6, 4, a.peau);
  r(ctx, x + 2, y + 3, 1, 1, "#1f2433");
  r(ctx, x + 5, y + 3, 1, 1, "#1f2433");
  r(ctx, x + 3, y + 5, 2, 1, eclaircir(a.peau.length === 7 ? a.peau : "#e0b090", -40));
  r(ctx, x, y + 6, 8, 5, a.haut);
  r(ctx, x + 3, y + 6, 2, 1, eclaircir(a.haut, 40));
}

function bureau(ctx: CanvasRenderingContext2D, x: number, y: number, allume: boolean, image: number) {
  // Écran
  r(ctx, x + 11, y - 8, 8, 7, "#1f2433");
  r(ctx, x + 12, y - 7, 6, 5, allume ? (image % 2 === 0 ? "#9fe0f0" : "#cdeaf3") : "#4a5568");
  if (allume) {
    r(ctx, x + 13, y - 6, 3, 1, "#1f2433");
    r(ctx, x + 13, y - 4, 4, 1, "#1f2433");
  }
  r(ctx, x + 14, y - 1, 2, 1, "#1f2433");
  // Plateau
  r(ctx, x, y, 22, 2, "#b5793f");
  r(ctx, x, y + 2, 22, 5, "#8b5a2b");
  r(ctx, x + 1, y + 7, 2, 3, "#6b4421");
  r(ctx, x + 19, y + 7, 2, 3, "#6b4421");
}

function dessinerPont(ctx: CanvasRenderingContext2D, x: number, y: number, a: Agent, image: number) {
  // Barre du navire
  const cx = x + 14;
  const cy = y + 32;
  r(ctx, cx - 1, cy - 8, 2, 16, "#6b4421");
  r(ctx, cx - 8, cy - 1, 16, 2, "#6b4421");
  r(ctx, cx - 6, cy - 6, 2, 2, "#6b4421");
  r(ctx, cx + 4, cy - 6, 2, 2, "#6b4421");
  r(ctx, cx - 6, cy + 4, 2, 2, "#6b4421");
  r(ctx, cx + 4, cy + 4, 2, 2, "#6b4421");
  r(ctx, cx - 5, cy - 5, 10, 10, "rgba(0,0,0,0)");
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 4, cy - 4, 8, 8);
  r(ctx, cx - 1, cy - 1, 2, 2, "#f5c542");
  // Table des cartes
  r(ctx, x + 30, y + 30, 24, 2, "#b5793f");
  r(ctx, x + 30, y + 32, 24, 6, "#8b5a2b");
  r(ctx, x + 33, y + 27, 14, 4, "#f6f1e7");
  r(ctx, x + 35, y + 28, 6, 1, "#3a6ea5");
  // Le quartier-maître, avec sa casquette
  const saut = image % 4 === 0 ? -1 : 0;
  personnage(ctx, x + 38, y + 18 + saut, a);
  r(ctx, x + 37, y + 17 + saut, 10, 2, "#1f2433");
  r(ctx, x + 41, y + 17 + saut, 2, 1, "#f5c542");
}
