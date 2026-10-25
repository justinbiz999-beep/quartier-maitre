import { MODE_DEMO } from "@/lib/config";

export function BandeauDemo() {
  if (!MODE_DEMO) return null;
  return (
    <div className="bg-bulle border-b-2 border-encre px-4 py-2 text-center text-sm font-semibold">
      Mode démo : données d&apos;exemple, rien n&apos;est envoyé ni enregistré en ligne.
    </div>
  );
}
