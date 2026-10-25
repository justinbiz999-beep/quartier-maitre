import Link from "next/link";
import { BandeauDemo } from "@/components/BandeauDemo";
import { CarteQG } from "@/components/CarteQG";
import { FormulaireAttente } from "@/components/FormulaireAttente";
import { Marque } from "@/components/Marque";
import { EQUIPES } from "@/lib/univers/boutique";

const INFOS_VITRINE = {
  etudes: { etat: "travaille" as const, enAttente: 0 },
  veille: { etat: "attend" as const, enAttente: 2 },
  creation: { etat: "dort" as const, enAttente: 0 },
  sav: { etat: "attend" as const, enAttente: 1 },
  finance: { etat: "dort" as const, enAttente: 0 },
  pont: { etat: "travaille" as const, enAttente: 0 },
};

export default function Accueil() {
  return (
    <>
      <BandeauDemo />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Marque />
        <Link href="/connexion" className="btn">
          Se connecter
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-6 md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-5">
            <p className="m-0 font-pixel text-sm tracking-[0.2em] text-gris">POUR LES E-COMMERÇANTS</p>
            <h1 className="m-0 text-4xl font-extrabold leading-tight sm:text-5xl">
              Votre boutique a un équipage.
              <br />
              Vous êtes le capitaine.
            </h1>
            <p className="m-0 max-w-xl text-lg leading-relaxed">
              Cinq équipes d&apos;agents IA surveillent vos concurrents, préparent vos réponses clients et calculent
              votre vraie marge. Le matin, vous décidez en quelques minutes. <strong>Rien ne part sans vous.</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#invitation" className="btn btn-principal">
                Demander une invitation
              </a>
              <a href="#fonctionnement" className="btn">
                Comment ça marche
              </a>
            </div>
          </div>
          <div className="bloc overflow-hidden p-0">
            <CarteQG
              infos={INFOS_VITRINE}
              messages={{
                etudes: "3 niches en cours de mesure.",
                veille: "Un concurrent a baissé ses prix de 15 %.",
                sav: "Réponse prête pour une cliente.",
              }}
              decor
            />
            <p className="m-0 border-t-2 border-encre px-4 py-3 text-sm text-gris">
              Votre QG : chaque équipe sur son île. Une pastille jaune, c&apos;est une décision qui vous attend.
            </p>
          </div>
        </section>

        <section id="fonctionnement" className="border-y-2 border-encre bg-papier">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="m-0 font-pixel text-3xl font-bold">Comment ça marche</h2>
            <ol className="mt-8 grid list-none gap-6 p-0 md:grid-cols-3">
              {[
                {
                  n: "1",
                  t: "L'équipage travaille seul",
                  d: "Chaque équipe passe à son rythme : la Veille le lundi, le SAV chaque jour, la Finance le vendredi.",
                },
                {
                  n: "2",
                  t: "Les décisions arrivent dans « À valider »",
                  d: "Avec les chiffres, les sources, et l'aperçu exact de ce qui partira : l'email tel qu'il sera envoyé.",
                },
                {
                  n: "3",
                  t: "Vous validez, l'action part",
                  d: "Un geste depuis votre téléphone. Refuser ou commenter, c'est aussi un geste. Sans validation, rien ne part.",
                },
              ].map((e) => (
                <li key={e.n} className="bloc flex flex-col gap-2 p-5">
                  <span className="font-pixel text-3xl font-bold">{e.n}</span>
                  <h3 className="m-0 text-lg font-extrabold">{e.t}</h3>
                  <p className="m-0 leading-relaxed">{e.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="m-0 font-pixel text-3xl font-bold">Votre équipage</h2>
          <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {EQUIPES.map((e) => (
              <li key={e.id} className="bloc flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="m-0 text-lg font-extrabold">{e.nom}</h3>
                  <span className="border border-encre px-2 py-0.5 text-xs font-semibold" style={{ background: e.sol }}>
                    {e.rythme}
                  </span>
                </div>
                <p className="m-0 leading-relaxed">{e.mission}</p>
                <p className="m-0 mt-1 border-l-4 border-bulle pl-3 text-sm italic text-gris">« {e.exemple} »</p>
              </li>
            ))}
            <li className="bloc flex flex-col gap-2 bg-encre p-5 text-creme">
              <h3 className="m-0 text-lg font-extrabold">Et vous, sur le pont</h3>
              <p className="m-0 leading-relaxed">
                Le quartier-maître coordonne l&apos;équipage et vous fait le point chaque lundi. Vous gardez la main sur
                chaque décision.
              </p>
            </li>
          </ul>
        </section>

        <section className="border-t-2 border-encre bg-papier">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
            {[
              { t: "Rien ne part sans vous", d: "Aucun email, aucune publication, aucune dépense sans votre validation." },
              { t: "Vous voyez tout avant", d: "Chaque proposition montre ses sources et l'aperçu exact de l'action." },
              { t: "Tout est tracé", d: "Le journal garde chaque passage, chaque proposition et chaque décision." },
            ].map((g) => (
              <div key={g.t} className="flex flex-col gap-1">
                <h3 className="m-0 text-lg font-extrabold">{g.t}</h3>
                <p className="m-0 leading-relaxed">{g.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="invitation" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="m-0 font-pixel text-3xl font-bold">Rejoindre les premiers capitaines</h2>
            <p className="m-0 text-lg leading-relaxed">
              Quartier-Maître est en test privé avec un petit groupe d&apos;e-commerçants. Les invitations partent par
              vagues de cinq, gratuitement pendant le test.
            </p>
          </div>
          <FormulaireAttente />
        </section>
      </main>

      <footer className="border-t-2 border-encre">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
          <span>Quartier-Maître · Les équipes de l&apos;app sont des agents d&apos;intelligence artificielle.</span>
          <a href="/confidentialite" className="text-encre underline">
            Confidentialité
          </a>
        </div>
      </footer>
    </>
  );
}
