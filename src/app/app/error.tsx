"use client";

import Link from "next/link";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid max-w-2xl gap-4 rounded-md border border-rose-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">QualiPilot</p>
      <h1 className="text-3xl font-black text-slate-950">Quelque chose a bloque</h1>
      <p className="text-sm leading-6 text-slate-600">
        Aucune donnee n'a ete supprimee. Vous pouvez recharger la vue ou revenir au tableau de bord.
      </p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Reessayer
        </button>
        <Link href="/app" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
          Tableau de bord
        </Link>
      </div>
    </main>
  );
}
