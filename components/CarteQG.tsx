"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EQUIPES, PONT, type Agent } from "@/lib/univers/boutique";
import type { EtatEquipe } from "@/lib/types";

// Carte du QG : un archipel d'îles flottantes dans le ciel, reliées par des ponts de bois.
// Au centre, l'île du quartier-maître (le pont du navire). Autour, une île par équipe.
// Dessin en pixels sur une petite toile agrandie sans flou ; les cartes d'équipe, bulles
// et zones cliquables sont du vrai HTML par-dessus.

const W = 272;
const H = 250;
const DX = 8;
const DY = 4;
const OX = 136;
const OY = 52;
const EPAIS = 9; // épaisseur de terre sous l'herbe
const POINTE = 16; // profondeur de la roche sous l'île

type Ile = { id: string; nom: string; sol: string; gx: number; gy: number; n: number; agents: Agent[] };

const POSITIONS: Record<string, [number, number]> = {
  finance: [0, 0],
  sav: [0, 10],
  etudes: [10, 0],
  pont: [9, 9],
  creation: [10, 20],
  veille: [20, 10],
};

const ILES: Ile[] = [
  ...EQUIPES.map((e) => ({ id: e.id, nom: e.nom, sol: e.sol, gx: POSITIONS[e.id][0], gy: POSITIONS[e.id][1], n: 6, agents: e.agents })),
  { id: "pont", nom: PONT.nom, sol: "#eadfc8", gx: 9, gy: 9, n: 8, agents: [PONT.agent] },
];

// Ponts de bois : [x0, y0, x1, y1] au niveau de l'herbe
const PASSERELLES: [number, number, number, number][] = [
  [3, 6, 3, 10], // finance → sav
  [6, 3, 10, 3], // finance → études
  [6, 13, 9, 13], // sav → pont
  [13, 6, 13, 9], // études → pont
  [17, 13, 20, 13], // pont → veille
  [13, 17, 13, 20], // pont → création
];

function P(x: number, y: number, z = 0): [number, number] {
  return [OX + (x - y) * DX, OY + (x + y) * DY - z];
}

function silhouette(i: Ile): [number, number][] {
  const { gx, gy, n } = i;
  return [P(gx, gy + n, 0), P(gx, gy, 0), P(gx + n, gy, 0), P(gx + n, gy, -EPAIS), P(gx + n, gy + n, -EPAIS), P(gx, gy + n, -EPAIS)];
}

export type InfoSalle = { etat: EtatEquipe; enAttente: number; prochain?: string };

type Props = {
  infos: Record<string, InfoSalle>;
  /** Dernier message de chaque équipe, affiché dans une bulle. */
  messages?: Record<string, string>;
  selection?: string | null;
  onSelect?: (id: string) => void;
  /** Version vitrine (page d'accueil) : pas de clic. */
  decor?: boolean;
};

export function CarteQG({ infos, messages = {}, selection, onSelect, decor = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState(0);
  const [survol, setSurvol] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setImage((i) => (i + 1) % 960), 380);
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
      ILES.map((ile) => {
        const pts = silhouette(ile);
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const clip = `polygon(${pts
          .map(([x, y]) => `${(((x - minX) / (maxX - minX)) * 100).toFixed(2)}% ${(((y - minY) / (maxY - minY)) * 100).toFixed(2)}%`)
          .join(", ")})`;
        const pc = (v: number, t: number) => `${(v / t) * 100}%`;
        const { gx, gy, n } = ile;
        // carte posée au-dessus de l'île, plus haut que la tête des agents
        const [cx, cy] = P(gx + n / 2, gy + n / 2, ile.id === "pont" ? 60 : 44);
        const [zx, zy] = P(gx + n / 2, gy + 1.6, 18);
        return {
          ile,
          zone: { left: pc(minX, W), top: pc(minY, H), width: pc(maxX - minX, W), height: pc(maxY - minY, H), clipPath: clip },
          carte: { left: pc(cx, W), top: pc(cy, H) },
          zz: { left: pc(zx, W), top: pc(zy, H) },
        };
      }),
    [],
  );

  return (
    <div className="relative w-full select-none overflow-hidden" style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        className="pixelise absolute inset-0 h-full w-full"
        role="img"
        aria-label="Carte du QG : un archipel d'îles dans le ciel, l'île du quartier-maître au centre et une île par équipe autour"
      />

      {/* Toute l'île est cliquable à la souris ; au clavier, on passe par la carte de l'équipe. */}
      {zones.map(({ ile, zone }) =>
        decor ? null : (
          <div
            key={`z-${ile.id}`}
            aria-hidden="true"
            onClick={() => onSelect?.(ile.id)}
            onMouseEnter={() => setSurvol(ile.id)}
            onMouseLeave={() => setSurvol(null)}
            className="absolute cursor-pointer"
            style={zone}
          />
        ),
      )}

      {zones.map(({ ile, zz }) => {
        const info = infos[ile.id];
        return info?.etat === "dort" && !info.enAttente && ile.id !== "pont" ? (
          <span
            key={`zz-${ile.id}`}
            className="zz pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-pixel text-xs font-bold text-papier sm:text-sm"
            style={zz}
            aria-hidden="true"
          >
            z<span className="text-[0.8em]">z</span>
          </span>
        ) : null;
      })}

      {zones.map(({ ile, carte }) => {
        const info = infos[ile.id] ?? { etat: "dort" as EtatEquipe, enAttente: 0 };
        const pont = ile.id === "pont";
        const etat = pont
          ? "coordonne l'équipage"
          : info.enAttente > 0
            ? `${info.enAttente} à valider`
            : info.etat === "travaille"
              ? "au travail"
              : "en pause";
        const point = info.enAttente > 0 ? "#f5c542" : info.etat === "travaille" || pont ? "#3fa66b" : "#9aa0ad";
        const message = messages[ile.id];
        const choisie = selection === ile.id;
        const contenu = (
          <>
            <span className="flex items-center gap-1 whitespace-nowrap sm:gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full border border-encre sm:hidden" style={{ background: point }} />
              <span className="hidden h-2.5 w-2.5 shrink-0 rounded-[3px] border border-encre sm:inline-block" style={{ background: ile.sol }} />
              <span className="text-[10px] font-extrabold leading-tight sm:text-[13px]">{ile.nom}</span>
              <span className="hidden -space-x-1 sm:flex">
                {ile.agents.map((a) => (
                  <span
                    key={a.prenom}
                    className="flex h-4 w-4 items-center justify-center rounded-full border border-encre text-[8px] font-extrabold text-papier"
                    style={{ background: a.haut }}
                  >
                    {a.prenom[0]}
                  </span>
                ))}
              </span>
            </span>
            <span className="hidden items-center gap-1 whitespace-nowrap text-[11px] leading-tight text-gris sm:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: point }} />
              {pont ? etat : `${ile.agents.length} agents · ${etat}`}
            </span>
            {info.enAttente > 0 && (
              <span className="bulle absolute -right-2.5 -top-3 flex h-[18px] min-w-[18px] items-center justify-center px-1 font-pixel text-[11px] font-bold sm:h-6 sm:min-w-6 sm:text-xs">
                {info.enAttente}
              </span>
            )}
          </>
        );
        const classes = `carte-ile relative flex flex-col gap-0.5 px-1.5 py-0.5 text-left sm:px-2 sm:py-1 ${choisie ? "carte-ile-choisie" : ""}`;
        // Pile ancrée au-dessus de l'île : la bulle de message (si récente), puis la carte de l'équipe.
        return (
          <div
            key={`c-${ile.id}`}
            className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1.5"
            style={carte}
          >
            {message && (
              <span className="message-ile hidden w-max max-w-44 px-2 py-1 text-[10px] leading-snug md:block" aria-hidden="true">
                <span className="font-bold text-encre">{ile.agents[0].prenom} · </span>
                <span className="italic text-gris">{message}</span>
              </span>
            )}
            {decor ? (
              <span className={classes} aria-hidden="true">
                {contenu}
              </span>
            ) : (
              <button
                type="button"
                className={`${classes} pointer-events-auto cursor-pointer`}
                onClick={() => onSelect?.(ile.id)}
                onMouseEnter={() => setSurvol(ile.id)}
                onMouseLeave={() => setSurvol(null)}
                onFocus={() => setSurvol(ile.id)}
                onBlur={() => setSurvol(null)}
                aria-pressed={choisie}
                aria-label={`${pont ? "Le pont, le quartier-maître" : `Équipe ${ile.nom}`} : ${etat}`}
              >
                {contenu}
              </button>
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

function poly(ctx: Ctx, pts: [number, number][], couleur: string) {
  ctx.fillStyle = couleur;
  const ys = pts.map((p) => p[1]);
  const y0 = Math.floor(Math.min(...ys));
  const y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y < y1; y++) {
    const yc = y + 0.5;
    let g = Infinity;
    let d = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
        const x = ax + ((yc - ay) / (by - ay)) * (bx - ax);
        g = Math.min(g, x);
        d = Math.max(d, x);
      }
    }
    if (g < d) {
      const a = Math.round(g);
      const b = Math.round(d);
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

function boite(ctx: Ctx, x: number, y: number, z: number, sx: number, sy: number, sz: number, couleur: string, contour = true) {
  poly(ctx, [P(x, y + sy, z + sz), P(x + sx, y + sy, z + sz), P(x + sx, y + sy, z), P(x, y + sy, z)], teinte(couleur, -18));
  poly(ctx, [P(x + sx, y, z + sz), P(x + sx, y + sy, z + sz), P(x + sx, y + sy, z), P(x + sx, y, z)], teinte(couleur, -42));
  poly(ctx, [P(x, y, z + sz), P(x + sx, y, z + sz), P(x + sx, y + sy, z + sz), P(x, y + sy, z + sz)], teinte(couleur, 14));
  if (contour) {
    const s = "rgba(31,36,51,0.5)";
    ligne(ctx, P(x, y + sy, z + sz), P(x + sx, y + sy, z + sz), s);
    ligne(ctx, P(x + sx, y, z + sz), P(x + sx, y + sy, z + sz), s);
    ligne(ctx, P(x + sx, y + sy, z), P(x + sx, y + sy, z + sz), s);
  }
}

function ombre(ctx: Ctx, x: number, y: number, z: number, largeur: number) {
  const [cx, cy] = P(x, y, z);
  ctx.fillStyle = "rgba(31,36,51,0.22)";
  ctx.fillRect(Math.round(cx - largeur / 2), Math.round(cy), largeur, 1);
  ctx.fillRect(Math.round(cx - largeur / 2 + 2), Math.round(cy - 1), largeur - 4, 1);
  ctx.fillRect(Math.round(cx - largeur / 2 + 2), Math.round(cy + 1), largeur - 4, 1);
}

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

/* Ciel, nuages, soleil, montagnes au loin */

const NUAGE_A = ["....wwww......", "..wwwWWwww....", ".wwWWWWWWwww..", "wwWWWWWWWWWwww", "wwwwwwwwwwwwww", ".gggggggggggg."];
const NUAGE_B = ["...www....", ".wwWWwww..", "wwWWWWWww.", "wwwwwwwwww", ".gggggggg."];

function ciel(ctx: Ctx, image: number) {
  const bandes = ["#7fc1ea", "#8cc8ed", "#98cef0", "#a6d5f2", "#b4dcf4", "#c3e3f6", "#d1eaf8", "#ddf0fa"];
  const h = Math.ceil(H / bandes.length);
  bandes.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * h, W, h);
  });
  // soleil
  sprite(
    ctx,
    ["...yyyy...", ".yyYYYYyy.", ".yYYYYYYy.", "yYYYYYYYYy", "yYYYYYYYYy", "yYYYYYYYYy", ".yYYYYYYy.", ".yyYYYYyy.", "...yyyy..."],
    { y: "#f7d35a", Y: "#fff1a8" },
    W - 34,
    12,
    false,
  );
  // montagnes lointaines
  ctx.fillStyle = "#b9dcf0";
  for (let x = 0; x < W; x++) {
    const h1 = 22 + Math.round(10 * Math.sin(x / 23) + 6 * Math.sin(x / 9 + 1));
    ctx.fillRect(x, H - h1, 1, h1);
  }
  ctx.fillStyle = "#a9d2ea";
  for (let x = 0; x < W; x++) {
    const h2 = 12 + Math.round(6 * Math.sin(x / 15 + 2) + 3 * Math.sin(x / 6));
    ctx.fillRect(x, H - h2, 1, h2);
  }
  // nuages qui dérivent
  const pal = { w: "#ffffff", W: "#ffffff", g: "#dbe9f3" };
  const nuages: [string[], number, number, number][] = [
    [NUAGE_A, 20, 22, 1],
    [NUAGE_B, 120, 40, 2],
    [NUAGE_A, 210, 64, 1],
    [NUAGE_B, 60, 150, 1],
    [NUAGE_A, 180, 176, 2],
    [NUAGE_B, 250, 120, 1],
    [NUAGE_A, -10, 206, 1],
  ];
  for (const [forme, x, y, vitesse] of nuages) {
    const dx = (((x - (image * vitesse) / 2) % (W + 30)) + W + 30) % (W + 30) - 20;
    sprite(ctx, forme, pal, dx, y, false);
  }
}

/* Îles */

function arbre(ctx: Ctx, x: number, y: number, taille: 1 | 2, image: number) {
  const [cx, cy] = P(x, y, 0);
  ombre(ctx, x, y, 0, 8);
  boite(ctx, x - 0.08, y - 0.08, 0, 0.16, 0.16, taille === 2 ? 7 : 5, "#7a4b2a", false);
  const balance = image % 6 < 3 ? 0 : 1;
  if (taille === 2) {
    sprite(
      ctx,
      ["...gggg...", ".gGGgggg..", "gGGgggggg.", "gGgggggGgg", "ggggggGggg", "gggGgggggg", ".gggggggg.", "..gggggg.."],
      { g: "#3e8e4f", G: "#7dcf6e" },
      cx - 5 + balance,
      cy - 15,
    );
  } else {
    sprite(ctx, ["..ggg..", ".gGggg.", "gGggggg", "gggggGg", ".ggggg."], { g: "#4a9e57", G: "#86d877" }, cx - 3 + balance, cy - 10);
  }
}

function cloture(ctx: Ctx, a: [number, number], b: [number, number]) {
  const longueur = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pas = Math.max(1, Math.round(longueur));
  for (let i = 0; i <= pas; i++) {
    const t = i / pas;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    boite(ctx, x - 0.06, y - 0.06, 0, 0.12, 0.12, 5, "#e9dcc0", false);
  }
  ligne(ctx, P(a[0], a[1], 4), P(b[0], b[1], 4), "#f6efe0");
  ligne(ctx, P(a[0], a[1], 2), P(b[0], b[1], 2), "#d8c8a6");
}

function socle(ctx: Ctx, ile: Ile) {
  const { gx, gy, n } = ile;
  const x1 = gx + n;
  const y1 = gy + n;
  // roche en pointe sous l'île
  const r = n * 0.3;
  poly(ctx, [P(gx, y1, -EPAIS), P(x1, y1, -EPAIS), P(x1 - r, y1 - r, -EPAIS - POINTE), P(gx + r, y1 - r, -EPAIS - POINTE)], "#8a7a68");
  poly(ctx, [P(x1, gy, -EPAIS), P(x1, y1, -EPAIS), P(x1 - r, y1 - r, -EPAIS - POINTE), P(x1 - r, gy + r, -EPAIS - POINTE)], "#6f6253");
  for (let k = 1; k < 4; k++) {
    const t = k / 4;
    const zz = -EPAIS - POINTE * t;
    ligne(ctx, P(gx + r * t + 0.4, y1 - r * t, zz), P(x1 - r * t - 0.4, y1 - r * t, zz), "#7d6e5d");
    ligne(ctx, P(x1 - r * t, gy + r * t + 0.4, zz), P(x1 - r * t, y1 - r * t - 0.4, zz), "#5f5346");
  }
  // terre
  poly(ctx, [P(gx, y1, 0), P(x1, y1, 0), P(x1, y1, -EPAIS), P(gx, y1, -EPAIS)], "#9b6a3c");
  poly(ctx, [P(x1, gy, 0), P(x1, y1, 0), P(x1, y1, -EPAIS), P(x1, gy, -EPAIS)], "#7c5230");
  ligne(ctx, P(gx, y1, -5), P(x1, y1, -5), "#875a32");
  ligne(ctx, P(x1, gy, -5), P(x1, y1, -5), "#6a4428");
  // cailloux
  for (let i = 0.7; i < n; i += 1.3) {
    const [ax, ay] = P(gx + i, y1, -7);
    ctx.fillStyle = "#c7a77d";
    ctx.fillRect(Math.round(ax), Math.round(ay), 2, 1);
    const [bx, by] = P(x1, gy + i + 0.4, -3);
    ctx.fillStyle = "#a5865f";
    ctx.fillRect(Math.round(bx), Math.round(by), 2, 1);
  }
  // herbe qui déborde sur les côtés
  poly(ctx, [P(gx, y1, 0), P(x1, y1, 0), P(x1, y1, -2), P(gx, y1, -2)], "#5aa846");
  poly(ctx, [P(x1, gy, 0), P(x1, y1, 0), P(x1, y1, -2), P(x1, gy, -2)], "#4a933a");
  for (let i = 0.3; i < n; i += 0.75) {
    const [ax, ay] = P(gx + i, y1, -2);
    ctx.fillStyle = "#5aa846";
    ctx.fillRect(Math.round(ax), Math.round(ay), 2, i % 1.5 < 0.75 ? 2 : 1);
    const [bx, by] = P(x1, gy + i, -2);
    ctx.fillStyle = "#4a933a";
    ctx.fillRect(Math.round(bx), Math.round(by), 2, i % 1.5 < 0.75 ? 1 : 2);
  }
  // dessus en herbe
  for (let ty = 0; ty < n; ty++)
    for (let tx = 0; tx < n; tx++)
      poly(ctx, [P(gx + tx, gy + ty), P(gx + tx + 1, gy + ty), P(gx + tx + 1, gy + ty + 1), P(gx + tx, gy + ty + 1)], (tx + ty) % 2 ? "#6fc052" : "#78c95a");
  ligne(ctx, P(gx, gy), P(x1, gy), "#8fd76f");
  ligne(ctx, P(gx, gy), P(gx, y1), "#8fd76f");
}

function plancher(ctx: Ctx, ile: Ile) {
  const { gx, gy, n, sol } = ile;
  const m = 0.7;
  const a = gx + m;
  const b = gy + m;
  const t = n - 2 * m;
  poly(ctx, [P(a, b + t, 1), P(a + t, b + t, 1), P(a + t, b + t, 0), P(a, b + t, 0)], teinte(sol, -45));
  poly(ctx, [P(a + t, b, 1), P(a + t, b + t, 1), P(a + t, b + t, 0), P(a + t, b, 0)], teinte(sol, -60));
  const pas = t / Math.round(t);
  for (let j = 0; j < Math.round(t); j++)
    for (let i = 0; i < Math.round(t); i++)
      poly(
        ctx,
        [P(a + i * pas, b + j * pas, 1), P(a + (i + 1) * pas, b + j * pas, 1), P(a + (i + 1) * pas, b + (j + 1) * pas, 1), P(a + i * pas, b + (j + 1) * pas, 1)],
        (i + j) % 2 ? teinte(sol, -10) : sol,
      );
}

/* Mobilier et personnages */

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

function personnage(ctx: Ctx, x: number, y: number, z: number, a: Agent, saut: number, casquette = false) {
  const [fx, fy] = P(x, y, z);
  ombre(ctx, x, y, z, 12);
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
    sprite(ctx, ["...cccccc...", "..cccyyccc..", ".cccccccccc.", "kkkkkkkkkkkk"], { c: "#1f2433", y: "#f5c542", k: "#0e1118" }, ox, oy - 3, false);
  }
}

function bureau(ctx: Ctx, x: number, y: number, z: number, allume: boolean, image: number) {
  boite(ctx, x, y, z, 1.9, 0.8, 7, "#a8713b");
  const sx = x + 1.2;
  const sy = y + 0.05;
  boite(ctx, sx + 0.2, sy + 0.1, z + 7, 0.12, 0.12, 2, "#1f2433", false);
  boite(ctx, sx, sy, z + 9, 0.62, 0.15, 7, "#2a2f3d", false);
  poly(
    ctx,
    [P(sx + 0.07, sy + 0.15, z + 15), P(sx + 0.55, sy + 0.15, z + 15), P(sx + 0.55, sy + 0.15, z + 10), P(sx + 0.07, sy + 0.15, z + 10)],
    allume ? (image % 2 ? "#bfeefa" : "#8fd8ec") : "#47506a",
  );
  if (allume) ligne(ctx, P(sx + 0.15, sy + 0.15, z + 13), P(sx + 0.45, sy + 0.15, z + 13), "#2f6f8f");
  boite(ctx, x + 0.55, y + 0.42, z + 7, 0.55, 0.18, 1, "#e8e4da", false);
  poly(ctx, [P(x + 0.1, y + 0.12, z + 7.1), P(x + 0.45, y + 0.12, z + 7.1), P(x + 0.45, y + 0.5, z + 7.1), P(x + 0.1, y + 0.5, z + 7.1)], "#fffdf8");
}

function accessoire(ctx: Ctx, id: string, gx: number, gy: number, image: number) {
  const z = 1;
  if (id === "etudes") {
    boite(ctx, gx + 0.8, gy + 3.4, z, 0.45, 1.3, 15, "#8b5a2b");
    const couleurs = ["#c0504d", "#3a6ea5", "#f5c542", "#4f7d4a", "#8a4f9e"];
    [z + 3, z + 9].forEach((zz, rang) => {
      for (let i = 0; i < 5; i++) {
        const y0 = gy + 3.48 + i * 0.24;
        poly(ctx, [P(gx + 1.25, y0, zz + 5 - (i % 2)), P(gx + 1.25, y0 + 0.19, zz + 5 - (i % 2)), P(gx + 1.25, y0 + 0.19, zz), P(gx + 1.25, y0, zz)], couleurs[(i + rang * 2) % 5]);
      }
    });
  }
  if (id === "veille") {
    const [cx, cy] = P(gx + 1.6, gy + 4.2, z);
    sprite(ctx, ["......gGG", "....gGGgg", "..gGGgg..", "gGgg.....", "...w.....", "..w.w....", ".w...w...", "w.....w.."], { g: "#b08d3c", G: "#e2c36a", w: "#5b3b20" }, cx - 5, cy - 9);
  }
  if (id === "creation") {
    const [cx, cy] = P(gx + 1.6, gy + 4.2, z);
    sprite(
      ctx,
      ["wwwwwwww", "wCCCccCw", "wCyyCCcw", "wCCrrCcw", "wccCCCcw", "wwwwwwww", ".w....w.", ".w....w.", "w......w"],
      { w: "#8b5a2b", C: "#f6f1e7", c: "#9fd3e6", y: "#f5c542", r: "#c0504d" },
      cx - 4,
      cy - 9,
    );
  }
  if (id === "sav") {
    boite(ctx, gx + 1.0, gy + 3.7, z, 0.75, 0.65, 6, "#c99a5b");
    boite(ctx, gx + 1.1, gy + 3.8, z + 6, 0.55, 0.45, 5, "#d8ad70");
    boite(ctx, gx + 1.9, gy + 3.9, z, 0.55, 0.55, 5, "#c99a5b");
  }
  if (id === "finance") {
    boite(ctx, gx + 0.9, gy + 3.5, z, 0.85, 0.85, 10, "#4a5163");
    const [dx, dy] = P(gx + 1.32, gy + 4.35, z + 5);
    sprite(ctx, [".yy.", "yYYy", "yYYy", ".yy."], { y: "#b08d3c", Y: "#f5c542" }, dx - 2, dy - 2, false);
    const [px, py] = P(gx + 3.6, gy + 4.4, z);
    sprite(ctx, ["..yy..", ".yYYy.", "yyyyyy", ".yYYy.", "yyyyyy", ".yYYy."], { y: "#c9a23f", Y: image % 4 === 0 ? "#fff3b0" : "#f5c542" }, px - 3, py - 6);
  }
}

function passerelle(ctx: Ctx, [x0, y0, x1, y1]: [number, number, number, number]) {
  const horizontal = y0 === y1;
  const l = 0.55;
  const coins: [number, number][] = horizontal
    ? [P(x0, y0 - l, 0), P(x1, y1 - l, 0), P(x1, y1 + l, 0), P(x0, y0 + l, 0)]
    : [P(x0 - l, y0, 0), P(x1 - l, y1, 0), P(x1 + l, y1, 0), P(x0 + l, y0, 0)];
  // épaisseur
  const bas = coins.map(([x, y]) => [x, y + 2] as [number, number]);
  poly(ctx, [coins[3], coins[2], bas[2], bas[3]], "#6b4421");
  poly(ctx, [coins[1], coins[2], bas[2], bas[1]], "#5a391b");
  poly(ctx, coins, "#b5793f");
  // planches
  const pas = 0.35;
  const longueur = horizontal ? x1 - x0 : y1 - y0;
  for (let t = pas; t < longueur; t += pas) {
    const a: [number, number] = horizontal ? P(x0 + t, y0 - l, 0) : P(x0 - l, y0 + t, 0);
    const b: [number, number] = horizontal ? P(x0 + t, y0 + l, 0) : P(x0 + l, y0 + t, 0);
    ligne(ctx, a, b, "#8b5a2b");
  }
  // cordes et poteaux
  const cotes: [number, number, number, number][] = horizontal
    ? [
        [x0, y0 - l, x1, y1 - l],
        [x0, y0 + l, x1, y1 + l],
      ]
    : [
        [x0 - l, y0, x1 - l, y1],
        [x0 + l, y0, x1 + l, y1],
      ];
  for (const [ax, ay, bx, by] of cotes) {
    boite(ctx, ax - 0.06, ay - 0.06, 0, 0.12, 0.12, 6, "#6b4421", false);
    boite(ctx, bx - 0.06, by - 0.06, 0, 0.12, 0.12, 6, "#6b4421", false);
    ligne(ctx, P(ax, ay, 5), P(bx, by, 5), "#e3cfa0");
  }
}

function ileEquipe(ctx: Ctx, ile: Ile, info: InfoSalle, image: number) {
  const { gx, gy, n } = ile;
  const travaille = info.etat === "travaille";
  socle(ctx, ile);
  plancher(ctx, ile);
  cloture(ctx, [gx + 0.7, gy + 0.3], [gx + n - 0.3, gy + 0.3]);
  cloture(ctx, [gx + 0.3, gy + 0.7], [gx + 0.3, gy + n - 0.6]);
  ile.agents.forEach((a, i) => {
    const bx = gx + 0.85 + i * 2.25;
    const by = gy + 1.55;
    const saut = travaille && (image + i * 2) % 4 < 2 ? 1 : 0;
    personnage(ctx, bx + 0.32, by - 0.3, 1, a, saut);
    bureau(ctx, bx, by, 1, travaille, image + i);
  });
  accessoire(ctx, ile.id, gx, gy, image);
  arbre(ctx, gx + 0.4, gy + n - 0.45, 2, image);
  arbre(ctx, gx + n - 0.4, gy + n - 0.45, 1, image + 2);
  arbre(ctx, gx + n - 0.4, gy + 0.45, 1, image + 1);
}

function ilePont(ctx: Ctx, ile: Ile, image: number) {
  const { gx, gy, n } = ile;
  socle(ctx, ile);
  // place ronde en planches
  const c = n / 2;
  for (let ty = 0; ty < n; ty++)
    for (let tx = 0; tx < n; tx++) {
      const d = Math.hypot(tx + 0.5 - c, ty + 0.5 - c);
      if (d > c - 0.6) continue;
      poly(ctx, [P(gx + tx, gy + ty, 1), P(gx + tx + 1, gy + ty, 1), P(gx + tx + 1, gy + ty + 1, 1), P(gx + tx, gy + ty + 1, 1)], (tx + ty) % 2 ? "#d9b483" : "#e6c393");
    }
  // anneau doré au centre
  for (let ty = 2; ty < 6; ty++)
    for (let tx = 2; tx < 6; tx++) {
      const d = Math.hypot(tx + 0.5 - c, ty + 0.5 - c);
      if (d < 1.9 && d > 0.9) poly(ctx, [P(gx + tx, gy + ty, 1), P(gx + tx + 1, gy + ty, 1), P(gx + tx + 1, gy + ty + 1, 1), P(gx + tx, gy + ty + 1, 1)], "#f2d27a");
    }
  arbre(ctx, gx + 0.6, gy + 0.6, 2, image);
  arbre(ctx, gx + n - 0.5, gy + 0.6, 1, image + 3);
  arbre(ctx, gx + 0.6, gy + n - 0.5, 1, image + 1);

  // mât avec voile et drapeau
  const mx = gx + 2.2;
  const my = gy + 2.2;
  boite(ctx, mx - 0.15, my - 0.15, 1, 0.3, 0.3, 46, "#7a4b2a", false);
  const [vx, vy] = P(mx, my, 40);
  sprite(
    ctx,
    ["vvvvvvvvvvvv", "vVVVVVVVVVVv", "vVVVVVVVVVv.", "vVVVVVVVVVv.", "vVVVVVVVVv..", "vVVVVVVVVv..", "vVVVVVVVv...", "vvvvvvvvv..."],
    { v: "#d9cfbb", V: "#fffdf8" },
    vx + 1,
    vy,
  );
  const ondule = image % 2;
  const [fx, fy] = P(mx, my, 48);
  sprite(ctx, ondule ? ["ffff.", "fFFff", "ffff."] : [".fff.", "fFFFf", "fff.."], { f: "#e2a72e", F: "#f5c542" }, fx + 1, fy, true);

  // barre du navire sur son socle
  const bx = gx + 4.6;
  const by = gy + 3.4;
  boite(ctx, bx - 0.2, by - 0.2, 1, 0.4, 0.4, 8, "#6b4421");
  const [wx, wy] = P(bx, by, 9);
  sprite(
    ctx,
    image % 2
      ? ["....r.r....", "..rRRRRRr..", ".rR.r.r.Rr.", ".RR..y..RR.", "rR.rryrr.Rr", ".RR..y..RR.", ".rR.r.r.Rr.", "..rRRRRRr..", "....r.r...."]
      : ["...r...r...", "..rRRRRRr..", "rrR..r..Rrr", ".RR..y..RR.", ".R.rryrr.R.", ".RR..y..RR.", "rrR..r..Rrr", "..rRRRRRr..", "...r...r..."],
    { r: "#6b4421", R: "#9a6532", y: "#f5c542" },
    wx - 5,
    wy - 9,
  );
  // le quartier-maître, à côté de la barre
  personnage(ctx, gx + 4.0, gy + 4.6, 1, ile.agents[0], image % 4 === 0 ? 1 : 0, true);
  // table des cartes
  boite(ctx, gx + 2.4, gy + 4.7, 1, 1.6, 0.9, 7, "#8b5a2b");
  poly(ctx, [P(gx + 2.6, gy + 4.85, 8.1), P(gx + 3.8, gy + 4.85, 8.1), P(gx + 3.8, gy + 5.45, 8.1), P(gx + 2.6, gy + 5.45, 8.1)], "#f2ead6");
  ligne(ctx, P(gx + 2.75, gy + 5.05, 8.1), P(gx + 3.5, gy + 5.3, 8.1), "#3a6ea5");
  // tonneau
  boite(ctx, gx + 5.6, gy + 5.4, 1, 0.55, 0.55, 7, "#8b5a2b");
  ligne(ctx, P(gx + 5.6, gy + 5.95, 3), P(gx + 6.15, gy + 5.95, 3), "#3a2a1a");
  ligne(ctx, P(gx + 5.6, gy + 5.95, 6), P(gx + 6.15, gy + 5.95, 6), "#3a2a1a");
}

function dessiner(ctx: Ctx, infos: Record<string, InfoSalle>, image: number, selection: string | null, survol: string | null) {
  ciel(ctx, image);

  // Îles et passerelles, de l'arrière vers l'avant
  type Element = { cle: number; dessin: () => void };
  const elements: Element[] = [];
  for (const ile of ILES) {
    const info = infos[ile.id] ?? { etat: "dort" as EtatEquipe, enAttente: 0 };
    elements.push({
      cle: ile.gx + ile.gy + ile.n,
      dessin: () => {
        if (ile.id === "pont") ilePont(ctx, ile, image);
        else ileEquipe(ctx, ile, info, image);
        const contour = silhouette(ile);
        if (info.etat === "dort" && info.enAttente === 0 && ile.id !== "pont") poly(ctx, contour, "rgba(30,40,70,0.32)");
        const couleur = selection === ile.id ? "#f5c542" : survol === ile.id ? "#ffffff" : null;
        if (couleur) {
          const haut: [number, number][] = [P(ile.gx, ile.gy), P(ile.gx + ile.n, ile.gy), P(ile.gx + ile.n, ile.gy + ile.n), P(ile.gx, ile.gy + ile.n)];
          for (let i = 0; i < 4; i++) {
            ligne(ctx, haut[i], haut[(i + 1) % 4], couleur);
            ligne(ctx, [haut[i][0], haut[i][1] - 1], [haut[(i + 1) % 4][0], haut[(i + 1) % 4][1] - 1], couleur);
          }
        }
      },
    });
  }
  for (const p of PASSERELLES) {
    elements.push({ cle: (p[0] + p[2]) / 2 + (p[1] + p[3]) / 2 + 0.5, dessin: () => passerelle(ctx, p) });
  }
  elements.sort((a, b) => a.cle - b.cle).forEach((e) => e.dessin());
}
