import type { Agent } from "@/lib/univers/boutique";

/** Petit portrait pixel d'un agent (16 × 16), dessiné en SVG. */
export function Portrait({ agent, fond = "#9fd3e6", taille = 40 }: { agent: Agent; fond?: string; taille?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={taille}
      height={taille}
      shapeRendering="crispEdges"
      className="shrink-0 border-2 border-encre"
      role="img"
      aria-label={`Portrait de ${agent.prenom}`}
    >
      <rect width="16" height="16" fill={fond} />
      <rect x="4" y="2" width="8" height="2" fill={agent.cheveux} />
      <rect x="3" y="3" width="1" height="4" fill={agent.cheveux} />
      <rect x="12" y="3" width="1" height="3" fill={agent.cheveux} />
      <rect x="4" y="4" width="8" height="6" fill={agent.peau} />
      <rect x="6" y="6" width="1" height="1" fill="#1f2433" />
      <rect x="9" y="6" width="1" height="1" fill="#1f2433" />
      <rect x="7" y="8" width="2" height="1" fill="#1f2433" opacity="0.5" />
      <rect x="6" y="10" width="4" height="1" fill={agent.peau} />
      <rect x="2" y="11" width="12" height="5" fill={agent.haut} />
    </svg>
  );
}
