import { Marque } from "@/components/Marque";

export const metadata = { title: "Confidentialité · Quartier-Maître" };

export default function Confidentialite() {
  return (
    <>
      <header className="mx-auto max-w-3xl px-4 py-4">
        <Marque />
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-16 leading-relaxed">
        <h1 className="m-0 text-3xl font-extrabold">Confidentialité</h1>
        <p className="bloc m-0 bg-bulle p-4 font-semibold">
          Version provisoire, pendant le test privé. La politique complète sera publiée avant l&apos;ouverture au public.
        </p>
        <h2 className="mb-0 text-xl font-extrabold">Liste d&apos;attente</h2>
        <p className="m-0">
          Nous collectons votre email, votre plateforme de vente et, si vous le précisez, ce qui vous fait perdre du
          temps. Ces informations servent uniquement à vous inviter au test et à choisir les premiers testeurs. Elles
          ne sont ni vendues ni partagées. Vous pouvez demander leur suppression à tout moment en écrivant à [ADRESSE
          DE CONTACT].
        </p>
        <h2 className="mb-0 text-xl font-extrabold">Intelligence artificielle</h2>
        <p className="m-0">
          Les équipes de Quartier-Maître sont des agents d&apos;intelligence artificielle. Elles préparent des
          propositions ; rien n&apos;est envoyé, publié ni dépensé sans votre validation.
        </p>
        <h2 className="mb-0 text-xl font-extrabold">Responsable</h2>
        <p className="m-0">[NOM DU RESPONSABLE OU DE LA SOCIÉTÉ], [ADRESSE].</p>
      </main>
    </>
  );
}
