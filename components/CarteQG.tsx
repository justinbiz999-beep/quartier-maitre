"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EQUIPES, PONT, type Agent } from "@/lib/univers/boutique";
import type { EtatEquipe } from "@/lib/types";

// Carte du QG en vue isométrique (3D façon jeu de gestion), dessinée pixel par pixel
// sur une petite toile (260 × 172) puis agrandie sans flou. Les noms, bulles et zones
// cliquables sont du vrai HTML par-dessus : lisibles et accessibles.

const W = 260;
const H = 172;
const DX = 8; // demi-largeur d'une dalle
const DY = 4; // demi-hauteur d'une dalle
const SALLE_X = 6; // dalles en largeur
const SALLE_Y = 5; // dalles en profondeur
const ECART = 1;
const MONDE_X = 3 * SALLE_X + 2 * ECART;
const MONDE_Y = 2 * SALLE_Y + ECART;
const MUR = 19; // hauteur des murs en pixels
const OX = MONDE_Y * DX + 7;
const OY = MUR + 15;

type Salle = { id: string; nom: string; sol: string; col: number; ligne: number; agents: Agent[] };

const SALLES: Salle[] = [
  ...EQUIPES.map((e) => ({ id: e.id, nom: e.nom, sol: e.sol, col: e.col, ligne: e.ligne, agents: e.agents })),
  { id: "pont", nom: PONT.nom, sol: "#eadfc8", col: 1, ligne: 1, agents: [PONT.agent] },
].sort((a, b) => a.ligne - b.ligne || a.col - b.col);

function coin(s: Salle) {
  return { gx: s.col * (SALLE_X + ECART), gy: s.ligne * (SALLE_Y + ECART) };
}

/** Projection isométrique : monde (dalles, hauteur en pixels) → toile. */
function P(x: number, y: number, z = 0): [number, number] {
  return [OX + (x - y) * DX, OY + (x + y) * DY - z];
}

function silhouette(s: Salle): [number, number][] {
  const { gx, gy } = coin(s);
  const x1 = gx + SALLE_X;
  const y1 = gy + SALLE_Y;
  return [P(gx, y1, MUR), P(gx, gy, MUR), P(x1, gy, MUR), P(x1, gy, 0), P(x1, y1, 0), P(gx, y1, 0)];
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
  const [survol, setSurvol] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setImage((i) => (i + 1) % 8), 380);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    dessiner(ctx, infos, image, selection ?? null, survol);
  }, [infos, image, selection, survol]);

  const zones = useMemo(
    () =>
      SALLES.map((s) => {
        const pts = silhouette(s);
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const clip = `polygon(${pts
          .map(([x, y]) => `${(((x - minX) / (maxX - minX)) * 100).toFixed(2)}% ${(((y - minY) / (maxY - minY)) * 100).toFixed(2)}%`)
          .join(", ")})`;
        const { gx, gy } = coin(s);
        // Étiquette posée au sol, devant la salle ; bulle au-dessus des agents
        const [ex, ey] = P(gx + SALLE_X / 2 + 0.6, gy + SALLE_Y - 0.5, 0);
        const [bx, by] = P(gx + SALLE_X / 2 - 0.2, gy + 1.4, 21);
        const [zx, zy] = P(gx + SALLE_X / 2 - 0.2, gy + 1.4, 16);
        const pc = (v: number, total: number) => `${(v / total) * 100}%`;
        return {
          s,
          zone: { left: pc(minX, W), top: pc(minY, H), width: pc(maxX - minX, W), height: pc(maxY - minY, H), clipPath: clip },
          etiquette: { left: pc(ex, W), top: pc(ey, H) },
          bulle: { left: pc(bx, W), top: pc(by, H) },
          zz: { left: pc(zx, W), top: pc(zy, H) },
        };
      }),
    [],
  );

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        className="pixelise absolute inset-0 h-full w-full"
        role="img"
        aria-label="Carte du QG en 3D : le pont au centre, entouré des salles des cinq équipes"
      />

      {zones.map(({ s, zone, etiquette, bulle, zz }) => {
        const info = infos[s.id] ?? { etat: "dort" as EtatEquipe, enAttente: 0 };
        const libelle =
          s.id === "pont"
            ? "Le pont : le quartier-maître"
            : `Équipe ${s.nom} : ${
                info.enAttente > 0
                  ? `${info.enAttente} décision${info.enAttente > 1 ? "s" : ""} en attente`
                  : info.etat === "travaille"
                    ? "au travail"
                    : "en pause jusqu'au prochain passage"
              }`;
        return (
          <div key={s.id}>
            {!decor && (
              <button
                type="button"
                onClick={() => onSelect?.(s.id)}
                onMouseEnter={() => setSurvol(s.id)}
                onMouseLeave={() => setSurvol(null)}
                onFocus={() => setSurvol(s.id)}
                onBlur={() => setSurvol(null)}
                aria-label={libelle}
                aria-pressed={selection === s.id}
                className="absolute cursor-pointer border-0 bg-transparent p-0"
                style={zone}
              />
            )}
            <span
              className="sticker pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-1.5 font-pixel text-[10px] leading-4 sm:text-xs sm:leading-5"
              style={etiquette}
              aria-hidden="true"
            >
              {s.nom}
            </span>
            {info.enAttente > 0 && (
              <span
                className="bulle pointer-events-none absolute flex h-6 min-w-6 -translate-x-1/2 -translate-y-full items-center justify-center px-1 font-pixel text-xs font-bold sm:h-7 sm:min-w-7 sm:text-sm"
                style={bulle}
                aria-hidden="true"
              >
                {info.enAttente}
              </span>
            )}
            {info.etat === "dort" && info.enAttente === 0 && s.id !== "pont" && (
              <span
                className="zz pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-pixel text-xs font-bold text-papier sm:text-sm"
                style={zz}
                aria-hidden="true"
              >
                z<span className="text-[0.8em]">z</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Dessin ───────────────────────── */

type Ctx = CanvasRenderingContext2D;

function teinte(hex: string, delta: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + delta)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Remplit un polygone convexe ligne par ligne : bords nets, sans flou. */
function poly(ctx: Ctx, pts: [number, number][], couleur: string) {
  ctx.fillStyle = couleur;
  const ys = pts.map((p) => p[1]);
  const y0 = Math.floor(Math.min(...ys));
  const y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y < y1; y++) {
    const yc = y + 0.5;
    let gauche = Infinity;
    let droite = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
        const x = ax + ((yc - ay) / (by - ay)) * (bx - ax);
        gauche = Math.min(gauche, x);
        droite = Math.max(droite, x);
      }
    }
    if (gauche < droite) {
      const a = Math.round(gauche);
      const b = Math.round(droite);
      if (b > a) ctx.fillRect(a, y, b - a, 1);
    }
  }
}

function ligne(ctx: Ctx, a: [number, number], b: [number, number], couleur: string) {
  ctx.fillStyle = couleur;
  let [x0, y0] = [Math.round(a[0]), Math.round(a[1])];
  const [x1, y1] = [Math.round(b[0]), Math.round(b[1])];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** Boîte en 3D : dessus, face avant gauche (éclairée), face avant droite (ombre). */
function boite(
  ctx: Ctx,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  couleur: string,
  opts: { contour?: boolean } = {},
) {
  const g: [number, number][] = [P(x, y + sy, z + sz), P(x + sx, y + sy, z + sz), P(x + sx, y + sy, z), P(x, y + sy, z)];
  const d: [number, number][] = [P(x + sx, y, z + sz), P(x + sx, y + sy, z + sz), P(x + sx, y + sy, z), P(x + sx, y, z)];
  const t: [number, number][] = [P(x, y, z + sz), P(x + sx, y, z + sz), P(x + sx, y + sy, z + sz), P(x, y + sy, z + sz)];
  poly(ctx, g, teinte(couleur, -18));
  poly(ctx, d, teinte(couleur, -42));
  poly(ctx, t, teinte(couleur, 14));
  if (opts.contour !== false) {
    const sombre = "rgba(31,36,51,0.55)";
    ligne(ctx, P(x, y + sy, z + sz), P(x + sx, y + sy, z + sz), sombre);
    ligne(ctx, P(x + sx, y, z + sz), P(x + sx, y + sy, z + sz), sombre);
    ligne(ctx, P(x + sx, y + sy, z), P(x + sx, y + sy, z + sz), sombre);
  }
}

function ombre(ctx: Ctx, x: number, y: number, largeur: number) {
  const [cx, cy] = P(x, y, 0);
  ctx.fillStyle = "rgba(31,36,51,0.22)";
  ctx.fillRect(Math.round(cx - largeur / 2), Math.round(cy), largeur, 1);
  ctx.fillRect(Math.round(cx - largeur / 2 + 2), Math.round(cy - 1), largeur - 4, 1);
  ctx.fillRect(Math.round(cx - largeur / 2 + 2), Math.round(cy + 1), largeur - 4, 1);
}

/** Dessine un petit sprite à partir d'une grille de lettres, avec contour sombre façon autocollant. */
function sprite(ctx: Ctx, grille: string[], palette: Record<string, string>, x: number, y: number, contour = true) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (contour) {
    ctx.fillStyle = "#1f2433";
    grille.forEach((rang, j) =>
      [...rang].forEach((c, i) => {
        if (c === ".") return;
        for (const [ox, oy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const v = grille[j + oy]?.[i + ox];
          if (!v || v === ".") ctx.fillRect(px + i + ox, py + j + oy, 1, 1);
        }
      }),
    );
  }
  grille.forEach((rang, j) =>
    [...rang].forEach((c, i) => {
      if (c === ".") return;
      ctx.fillStyle = palette[c] ?? "#ff00ff";
      ctx.fillRect(px + i, py + j, 1, 1);
    }),
  );
}

const CORPS = [
  "...hhhhh....",
  "..hHHhhhhh..",
  ".hHhhhhhhhh.",
  ".hhppppppph.",
  ".hpppppppqh.",
  ".hpepppepq..",
  "..ppppppqq..",
  "..ppprrpq...",
  "...qppppq...",
  ".tTTTTTTts..",
  "tTTTTTTTTss.",
  "pTTTTTTTTsp.",
  "pTTTTTTTTsp.",
  ".TTTTTTTTs..",
  "..jjjjjjk...",
  "..jjj.jjk...",
  "..jjj.jjk...",
  ".bbbb.bbbb..",
];

function personnage(ctx: Ctx, x: number, y: number, a: Agent, saut: number, casquette = false) {
  const [fx, fy] = P(x, y, 0);
  ombre(ctx, x, y, 12);
  const pal = {
    h: a.cheveux,
    H: teinte(a.cheveux, 45),
    p: a.peau,
    q: teinte(a.peau, -32),
    e: "#1f2433",
    r: teinte(a.peau, -55),
    T: a.haut,
    t: teinte(a.haut, 35),
    s: teinte(a.haut, -40),
    j: "#2c3140",
    k: "#1d212c",
    b: "#15171f",
  };
  const ox = fx - 6;
  const oy = fy - CORPS.length + 1 - saut;
  sprite(ctx, CORPS, pal, ox, oy);
  if (casquette) {
    sprite(
      ctx,
      ["...cccccc...", "..cccyyccc..", ".cccccccccc.", "kkkkkkkkkkkk"],
      { c: "#1f2433", y: "#f5c542", k: "#0e1118" },
      ox,
      oy - 3,
      false,
    );
  }
}

function bureau(ctx: Ctx, x: number, y: number, allume: boolean, image: number) {
  boite(ctx, x, y, 0, 2.2, 0.85, 8, "#a8713b");
  // pieds visibles sous le plateau
  boite(ctx, x + 0.05, y + 0.7, 0, 0.12, 0.12, 6, "#6b4421", { contour: false });
  boite(ctx, x + 2.03, y + 0.7, 0, 0.12, 0.12, 6, "#6b4421", { contour: false });
  // écran, sur le côté pour laisser voir le visage de l'agent
  const sx = x + 1.5;
  const sy = y + 0.05;
  boite(ctx, sx + 0.22, sy + 0.12, 8, 0.12, 0.12, 2, "#1f2433", { contour: false });
  boite(ctx, sx, sy, 10, 0.75, 0.16, 8, "#2a2f3d", { contour: false });
  const ecran: [number, number][] = [P(sx + 0.08, sy + 0.16, 17), P(sx + 0.67, sy + 0.16, 17), P(sx + 0.67, sy + 0.16, 11), P(sx + 0.08, sy + 0.16, 11)];
  poly(ctx, ecran, allume ? (image % 2 ? "#bfeefa" : "#8fd8ec") : "#47506a");
  if (allume) {
    ligne(ctx, P(sx + 0.18, sy + 0.16, 15), P(sx + 0.45, sy + 0.16, 15), "#2f6f8f");
    ligne(ctx, P(sx + 0.18, sy + 0.16, 13), P(sx + 0.58, sy + 0.16, 13), "#2f6f8f");
  }
  // clavier, papiers et tasse
  boite(ctx, x + 0.75, y + 0.45, 8, 0.6, 0.2, 1, "#e8e4da", { contour: false });
  poly(ctx, [P(x + 0.15, y + 0.15, 8.1), P(x + 0.6, y + 0.15, 8.1), P(x + 0.6, y + 0.6, 8.1), P(x + 0.15, y + 0.6, 8.1)], "#fffdf8");
  boite(ctx, x + 1.95, y + 0.5, 8, 0.16, 0.16, 3, "#f6f1e7", { contour: false });
}

function plante(ctx: Ctx, x: number, y: number, image: number) {
  boite(ctx, x, y, 0, 0.45, 0.45, 6, "#c2673a");
  const [cx, cy] = P(x + 0.22, y + 0.22, 6);
  const balance = image % 4 < 2 ? 0 : 1;
  sprite(
    ctx,
    ["...v.v...", "..vVvVv..", ".vVvvvVv.", "vVvvVvvVv", ".vvVvVvv.", "..vvvvv.."],
    { v: "#3e8e4f", V: "#6cc06f" },
    cx - 4 + balance,
    cy - 7,
  );
}

function fenetre(ctx: Ctx, gx: number, gy: number, jour: boolean) {
  const x0 = gx + SALLE_X - 2.3;
  const x1 = gx + SALLE_X - 0.9;
  poly(ctx, [P(x0, gy, 16), P(x1, gy, 16), P(x1, gy, 7), P(x0, gy, 7)], "#1f2433");
  poly(ctx, [P(x0 + 0.12, gy, 15), P(x1 - 0.12, gy, 15), P(x1 - 0.12, gy, 8), P(x0 + 0.12, gy, 8)], jour ? "#bfe6f3" : "#5a7f9c");
  poly(ctx, [P(x0 + 0.2, gy, 14), P(x0 + 0.55, gy, 14), P(x0 + 0.45, gy, 10), P(x0 + 0.2, gy, 10)], "rgba(255,255,255,0.55)");
  ligne(ctx, P((x0 + x1) / 2, gy, 15), P((x0 + x1) / 2, gy, 8), "#1f2433");
}

function decor(ctx: Ctx, id: string, gx: number, gy: number, image: number) {
  if (id === "etudes") {
    // bibliothèque contre le mur de gauche
    boite(ctx, gx + 0.05, gy + 2.7, 0, 0.5, 1.7, 17, "#8b5a2b");
    const couleurs = ["#c0504d", "#3a6ea5", "#f5c542", "#4f7d4a", "#8a4f9e", "#d9822b"];
    [3, 10].forEach((z, rang) => {
      for (let i = 0; i < 6; i++) {
        const y0 = gy + 2.8 + i * 0.25;
        poly(
          ctx,
          [P(gx + 0.55, y0, z + 5 - (i % 2)), P(gx + 0.55, y0 + 0.2, z + 5 - (i % 2)), P(gx + 0.55, y0 + 0.2, z), P(gx + 0.55, y0, z)],
          couleurs[(i + rang * 2) % couleurs.length],
        );
      }
    });
  }
  if (id === "veille") {
    // longue-vue tournée vers la fenêtre
    const [cx, cy] = P(gx + 1.0, gy + 3.9, 0);
    sprite(
      ctx,
      ["......gGG", "....gGGgg", "..gGGgg..", "gGgg.....", "...w.....", "..w.w....", ".w...w...", "w.....w.."],
      { g: "#b08d3c", G: "#e2c36a", w: "#5b3b20" },
      cx - 5,
      cy - 9,
    );
  }
  if (id === "creation") {
    // chevalet avec une toile colorée
    const [cx, cy] = P(gx + 1.0, gy + 3.9, 0);
    sprite(
      ctx,
      ["wwwwwwww", "wCCCccCw", "wCyyCCcw", "wCCrrCcw", "wccCCCcw", "wwwwwwww", ".w....w.", ".w....w.", "w......w"],
      { w: "#8b5a2b", C: "#f6f1e7", c: "#9fd3e6", y: "#f5c542", r: "#c0504d" },
      cx - 4,
      cy - 9,
    );
  }
  if (id === "sav") {
    // colis en attente d'expédition
    boite(ctx, gx + 0.3, gy + 3.6, 0, 0.8, 0.7, 6, "#c99a5b");
    boite(ctx, gx + 0.4, gy + 3.7, 6, 0.6, 0.5, 5, "#d8ad70");
    boite(ctx, gx + 1.2, gy + 3.8, 0, 0.6, 0.6, 5, "#c99a5b");
  }
  if (id === "finance") {
    // coffre-fort
    boite(ctx, gx + 0.2, gy + 3.4, 0, 0.9, 0.9, 11, "#4a5163");
    const [dx, dy] = P(gx + 0.65, gy + 4.3, 6);
    sprite(ctx, [".yy.", "yYYy", "yYYy", ".yy."], { y: "#b08d3c", Y: "#f5c542" }, dx - 2, dy - 2, false);
    // pile de pièces
    const [px, py] = P(gx + 4.0, gy + 4.0, 0);
    const brillant = image % 4 === 0;
    sprite(ctx, ["..yy..", ".yYYy.", "yyyyyy", ".yYYy.", "yyyyyy", ".yYYy."], { y: "#c9a23f", Y: brillant ? "#fff3b0" : "#f5c542" }, px - 3, py - 6);
  }
}

function barre(ctx: Ctx, x: number, y: number, image: number) {
  const [cx, cy] = P(x, y, 0);
  boite(ctx, x - 0.15, y - 0.15, 0, 0.3, 0.3, 9, "#6b4421");
  const tourne = image % 2;
  sprite(
    ctx,
    tourne
      ? ["....r.r....", "..rRRRRRr..", ".rR.r.r.Rr.", ".RR..y..RR.", "rR.rryrr.Rr", ".RR..y..RR.", ".rR.r.r.Rr.", "..rRRRRRr..", "....r.r...."]
      : ["...r...r...", "..rRRRRRr..", "rrR..r..Rrr", ".RR..y..RR.", ".R.rryrr.R.", ".RR..y..RR.", "rrR..r..Rrr", "..rRRRRRr..", "...r...r..."],
    { r: "#6b4421", R: "#9a6532", y: "#f5c542" },
    cx - 5,
    cy - 18,
  );
}

function dessinerSalle(ctx: Ctx, s: Salle, info: InfoSalle, image: number) {
  const { gx, gy } = coin(s);
  const x1 = gx + SALLE_X;
  const y1 = gy + SALLE_Y;
  const travaille = info.etat === "travaille";

  // Sol en damier
  for (let ty = 0; ty < SALLE_Y; ty++) {
    for (let tx = 0; tx < SALLE_X; tx++) {
      const x = gx + tx;
      const y = gy + ty;
      poly(ctx, [P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], (tx + ty) % 2 ? teinte(s.sol, -12) : s.sol);
    }
  }
  // Tapis au centre
  poly(ctx, [P(gx + 1.5, gy + 2.6), P(gx + 4.5, gy + 2.6), P(gx + 4.5, gy + 4.4), P(gx + 1.5, gy + 4.4)], teinte(s.sol, -28));
  poly(ctx, [P(gx + 1.7, gy + 2.8), P(gx + 4.3, gy + 2.8), P(gx + 4.3, gy + 4.2), P(gx + 1.7, gy + 4.2)], teinte(s.sol, 18));

  // Murs du fond (épaisseur visible sur le dessus)
  const murA = "#efe7d6";
  const murB = "#ddd2bd";
  poly(ctx, [P(gx, gy, 0), P(x1, gy, 0), P(x1, gy, MUR), P(gx, gy, MUR)], murA);
  poly(ctx, [P(gx, gy, 0), P(gx, y1, 0), P(gx, y1, MUR), P(gx, gy, MUR)], murB);
  poly(ctx, [P(gx, gy, 3), P(x1, gy, 3), P(x1, gy, 0), P(gx, gy, 0)], "#cbbd9f");
  poly(ctx, [P(gx, gy, 3), P(gx, y1, 3), P(gx, y1, 0), P(gx, gy, 0)], "#b9aa8b");
  poly(ctx, [P(gx - 0.3, gy - 0.3, MUR), P(x1, gy - 0.3, MUR), P(x1, gy, MUR), P(gx, gy, MUR)], "#2a2f3d");
  poly(ctx, [P(gx - 0.3, gy - 0.3, MUR), P(gx, gy, MUR), P(gx, y1, MUR), P(gx - 0.3, y1, MUR)], "#2a2f3d");
  poly(ctx, [P(x1, gy - 0.3, MUR), P(x1, gy, MUR), P(x1, gy, 0), P(x1, gy - 0.3, 0)], "#3a4152");
  poly(ctx, [P(gx - 0.3, y1, MUR), P(gx, y1, MUR), P(gx, y1, 0), P(gx - 0.3, y1, 0)], "#4a5163");
  // Bande de couleur de l'équipe sur le mur
  poly(ctx, [P(gx, gy, MUR - 3), P(x1, gy, MUR - 3), P(x1, gy, MUR - 5), P(gx, gy, MUR - 5)], s.sol);
  poly(ctx, [P(gx, gy, MUR - 3), P(gx, y1, MUR - 3), P(gx, y1, MUR - 5), P(gx, gy, MUR - 5)], teinte(s.sol, -20));

  fenetre(ctx, gx, gy, travaille || s.id === "pont");

  if (s.id === "pont") {
    plante(ctx, gx + 0.3, gy + 0.3, image);
    barre(ctx, gx + 1.6, gy + 2.6, image);
    personnage(ctx, gx + 3.6, gy + 1.5, s.agents[0], image % 4 === 0 ? 1 : 0, true);
    // table des cartes
    boite(ctx, gx + 2.7, gy + 2.2, 0, 2.2, 1.1, 8, "#8b5a2b");
    poly(ctx, [P(gx + 3.0, gy + 2.35, 8.1), P(gx + 4.4, gy + 2.35, 8.1), P(gx + 4.4, gy + 3.1, 8.1), P(gx + 3.0, gy + 3.1, 8.1)], "#f2ead6");
    ligne(ctx, P(gx + 3.2, gy + 2.6, 8.1), P(gx + 4.0, gy + 2.9, 8.1), "#3a6ea5");
    ligne(ctx, P(gx + 3.5, gy + 2.5, 8.1), P(gx + 3.6, gy + 3.0, 8.1), "#c0504d");
    return;
  }

  // Objets triés de l'arrière vers l'avant : les agents à leur bureau, puis le décor devant
  s.agents.forEach((a, i) => {
    const bx = gx + 0.45 + i * 2.65;
    const by = gy + 1.5;
    const saut = travaille && (image + i * 2) % 4 < 2 ? 1 : 0;
    personnage(ctx, bx + 0.35, by - 0.3, a, saut);
    bureau(ctx, bx, by, travaille, image + i);
  });
  decor(ctx, s.id, gx, gy, image);
  plante(ctx, gx + SALLE_X - 0.65, gy + SALLE_Y - 0.7, image);
}

function dessiner(ctx: Ctx, infos: Record<string, InfoSalle>, image: number, selection: string | null, survol: string | null) {
  ctx.clearRect(0, 0, W, H);

  // Le pont du navire : une grande dalle en bois avec de l'épaisseur
  const m = 0.7;
  boite(ctx, -m, -m, -7, MONDE_X + 2 * m, MONDE_Y + 2 * m, 7, "#9a7a4c", { contour: false });
  for (let y = -m; y < MONDE_Y + m; y += 0.5) {
    poly(
      ctx,
      [P(-m, y), P(MONDE_X + m, y), P(MONDE_X + m, Math.min(y + 0.5, MONDE_Y + m)), P(-m, Math.min(y + 0.5, MONDE_Y + m))],
      Math.round(y * 2) % 2 ? "#b89a6a" : "#c2a575",
    );
  }
  // Bord sombre du pont
  ligne(ctx, P(-m, MONDE_Y + m, -7), P(MONDE_X + m, MONDE_Y + m, -7), "#5b4428");
  ligne(ctx, P(MONDE_X + m, -m, -7), P(MONDE_X + m, MONDE_Y + m, -7), "#5b4428");

  for (const s of SALLES) {
    const info = infos[s.id] ?? { etat: "dort" as EtatEquipe, enAttente: 0 };
    dessinerSalle(ctx, s, info, image);
    const contour = silhouette(s);
    if (info.etat === "dort" && info.enAttente === 0 && s.id !== "pont") {
      poly(ctx, contour, "rgba(24,28,44,0.38)");
    }
    const couleur = selection === s.id ? "#f5c542" : survol === s.id ? "#ffffff" : null;
    if (couleur) {
      for (let i = 0; i < contour.length; i++) ligne(ctx, contour[i], contour[(i + 1) % contour.length], couleur);
      const decale = contour.map(([x, y]) => [x, y + 1] as [number, number]);
      for (let i = 0; i < decale.length; i++) ligne(ctx, decale[i], decale[(i + 1) % decale.length], couleur);
    }
  }
}
