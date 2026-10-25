import type { Agent } from "@/lib/univers/boutique";

function teinte(hex: string, delta: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + delta)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Portrait pixel d'un agent (16 × 16) avec volumes : lumière à gauche, ombre à droite. */
export function Portrait({ agent, fond = "#9fd3e6", taille = 40 }: { agent: Agent; fond?: string; taille?: number }) {
  const h = agent.cheveux;
  const p = agent.peau;
  const t = agent.haut;
  return (
    <span
      className="inline-block shrink-0 rounded-[4px] border-2 border-encre"
      style={{ boxShadow: "0 3px 0 #1f2433, 0 5px 6px rgba(31,36,51,0.25)", lineHeight: 0 }}
    >
      <svg viewBox="0 0 16 16" width={taille} height={taille} shapeRendering="crispEdges" role="img" aria-label={`Portrait de ${agent.prenom}`}>
        <rect width="16" height="16" fill={fond} />
        <rect y="0" width="16" height="6" fill="#ffffff" opacity="0.18" />
        {/* cheveux */}
        <rect x="4" y="1" width="8" height="1" fill={h} />
        <rect x="3" y="2" width="10" height="2" fill={h} />
        <rect x="5" y="2" width="3" height="1" fill={teinte(h, 50)} />
        <rect x="2" y="3" width="2" height="5" fill={h} />
        <rect x="12" y="3" width="2" height="4" fill={teinte(h, -25)} />
        {/* visage */}
        <rect x="4" y="4" width="8" height="6" fill={p} />
        <rect x="10" y="4" width="2" height="6" fill={teinte(p, -30)} />
        <rect x="5" y="6" width="1" height="2" fill="#1f2433" />
        <rect x="9" y="6" width="1" height="2" fill="#1f2433" />
        <rect x="5" y="6" width="1" height="1" fill="#ffffff" opacity="0.6" />
        <rect x="4" y="8" width="1" height="1" fill="#e58f8f" opacity="0.6" />
        <rect x="10" y="8" width="1" height="1" fill="#e58f8f" opacity="0.6" />
        <rect x="7" y="8" width="2" height="1" fill={teinte(p, -60)} />
        <rect x="6" y="10" width="4" height="1" fill={teinte(p, -30)} />
        {/* buste */}
        <rect x="2" y="11" width="12" height="5" fill={t} />
        <rect x="2" y="11" width="3" height="5" fill={teinte(t, 30)} />
        <rect x="11" y="11" width="3" height="5" fill={teinte(t, -35)} />
        <rect x="7" y="11" width="2" height="2" fill={teinte(t, 45)} />
      </svg>
    </span>
  );
}
