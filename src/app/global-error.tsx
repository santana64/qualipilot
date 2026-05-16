"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
          <section className="w-full max-w-xl rounded-md border border-rose-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">QualiPilot</p>
            <h1 className="mt-6 text-4xl font-black text-slate-950">Incident applicatif</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Une erreur inattendue est survenue. Elle peut etre signalee au monitoring si celui-ci est configure.
            </p>
            <button onClick={reset} className="mt-6 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Reessayer
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
