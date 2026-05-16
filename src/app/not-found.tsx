import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">QualiPilot</p>
        <h1 className="mt-6 text-4xl font-black text-slate-950">Page introuvable</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Le lien ne correspond a aucune page disponible. Votre espace qualite reste intact.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/app" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Retour au tableau de bord
          </Link>
          <Link href="/" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
            Accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
