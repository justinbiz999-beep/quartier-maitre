import Link from "next/link";

export function IconeAncre({ taille = 28 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={taille} height={taille} shapeRendering="crispEdges" aria-hidden="true">
      <rect width="16" height="16" fill="#1f2433" />
      <rect x="7" y="2" width="2" height="2" fill="#f5c542" />
      <rect x="6" y="4" width="4" height="1" fill="#f5c542" />
      <rect x="7" y="5" width="2" height="7" fill="#f6f1e7" />
      <rect x="4" y="7" width="8" height="1" fill="#f6f1e7" />
      <rect x="3" y="10" width="1" height="2" fill="#f6f1e7" />
      <rect x="12" y="10" width="1" height="2" fill="#f6f1e7" />
      <rect x="4" y="12" width="2" height="1" fill="#f6f1e7" />
      <rect x="10" y="12" width="2" height="1" fill="#f6f1e7" />
      <rect x="6" y="13" width="4" height="1" fill="#f6f1e7" />
    </svg>
  );
}

export function Marque({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 no-underline text-encre" aria-label="Quartier-Maître, accueil">
      <IconeAncre />
      <span className="font-pixel text-xl font-bold tracking-wide">Quartier-Maître</span>
    </Link>
  );
}
