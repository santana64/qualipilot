import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="font-black tracking-tight text-slate-950">QualiPilot</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">{title}</h1>
          <div className="prose prose-slate mt-8 max-w-none text-sm leading-7 text-slate-700">{children}</div>
        </article>
        <nav className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/mentions-legales" className="hover:text-slate-900">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-slate-900">Confidentialité</Link>
          <Link href="/conditions-generales" className="hover:text-slate-900">CGU</Link>
          <Link href="/cookies" className="hover:text-slate-900">Cookies</Link>
        </nav>
      </main>
    </div>
  );
}
