import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileArchive,
  FolderOpen,
  Layers,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { LandingPricing } from "@/components/landing-pricing";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";

/* ─── Nav ─── */
function LandingNav() {
  return (
    <header className="sticky top-0 z-20 bg-nav-bg/95 backdrop-blur" style={{ borderBottom: "1px solid rgba(250,249,245,0.08)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span className="text-[15px] font-bold tracking-tight text-white">QualiPilot</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium transition-colors"
            style={{ color: "#a8a49c" }}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors"
          >
            Créer mon espace
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─── */
function HeroPreview() {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-float">
      {/* Readiness score */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-faint">Niveau de préparation</p>
          <p className="mt-0.5 text-3xl font-bold text-foreground">82 %</p>
        </div>
        <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1 text-xs font-medium text-[#92400e]">
          À surveiller
        </span>
      </div>

      {/* Criterion progress */}
      <div className="mt-4 grid gap-2">
        {[
          { label: "Critère 1 — Information des publics", score: 92, color: "#15803d" },
          { label: "Critère 3 — Évaluation des apprentissages", score: 76, color: "#d97706" },
          { label: "Critère 6 — Accessibilité handicap", score: 54, color: "#dc2626" },
        ].map(({ label, score, color }) => (
          <div key={label} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-foreground-muted">{label}</span>
              <span className="text-xs font-bold tabular-nums text-foreground">{score} %</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised">
              <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick status */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-2.5 text-xs font-medium text-[#991b1b]">
          5 preuves à vérifier
        </div>
        <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-xs font-medium text-[#92400e]">
          2 actions en retard
        </div>
      </div>

      {/* Export CTA */}
      <div className="mt-3">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-xs font-semibold text-white">
          <FileArchive className="h-3.5 w-3.5" />
          Exporter le dossier audit
        </div>
      </div>
    </div>
  );
}

/* ─── Pain points ─── */
const painPoints = [
  {
    icon: "📂",
    title: "Preuves introuvables",
    text: "Je ne sais pas quelles preuves manquent ni où j'en ai mis les dernières.",
  },
  {
    icon: "📊",
    title: "Tableurs de crise",
    text: "Mes suivis d'indicateurs vivent dans des fichiers Excel dispersés.",
  },
  {
    icon: "😰",
    title: "Panique avant l'audit",
    text: "Je découvre les points manquants deux semaines avant le rendez-vous.",
  },
  {
    icon: "🔄",
    title: "Amélioration continue non tracée",
    text: "Je ne suis pas mes actions correctives ni leurs résultats dans le temps.",
  },
];

/* ─── Workflow ─── */
const workflowSteps: Array<{ num: string; icon: LucideIcon; title: string; text: string }> = [
  {
    num: "01",
    icon: ShieldCheck,
    title: "Cadrez votre organisme",
    text: "Profil, statut Qualiopi, prochaine échéance et activités concernées.",
  },
  {
    num: "02",
    icon: BookOpen,
    title: "Suivez les 32 indicateurs",
    text: "Statuts, notes, risques et preuves associées aux 7 critères RNQ.",
  },
  {
    num: "03",
    icon: FolderOpen,
    title: "Centralisez vos preuves",
    text: "Liez chaque preuve aux indicateurs concernés et suivez leurs dates de validité.",
  },
  {
    num: "04",
    icon: ListChecks,
    title: "Traitez les écarts",
    text: "Créez des actions priorisées, assignez des responsables et clôturez avec preuve.",
  },
  {
    num: "05",
    icon: FileArchive,
    title: "Exportez le dossier",
    text: "Synthèse imprimable : indicateurs, preuves, formations, documents et points manquants.",
  },
];

/* ─── Features ─── */
const features: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: BookOpen,
    title: "Référentiel RNQ structuré",
    text: "Les 7 critères et 32 indicateurs Qualiopi avec statuts, risques et preuves attendues.",
  },
  {
    icon: FolderOpen,
    title: "Bibliothèque de preuves",
    text: "Centralisez procédures, programmes, émargements, évaluations, CV formateurs et questionnaires.",
  },
  {
    icon: ListChecks,
    title: "Plan d'amélioration continue",
    text: "Actions priorisées, responsables, échéances et clôtures documentées liées aux indicateurs.",
  },
  {
    icon: Layers,
    title: "Programmes de formation",
    text: "Gérez les informations publiques et qualité de chaque programme avec un score de complétude.",
  },
  {
    icon: LayoutDashboard,
    title: "Cockpit audit",
    text: "Vue globale du niveau de préparation, des points critiques et des prochaines échéances.",
  },
  {
    icon: FileArchive,
    title: "Export dossier préparatoire",
    text: "Document structuré imprimable pour votre échange avec le certificateur.",
  },
];

/* ─── Pricing ─── */
const pricingPlans = [
  {
    id: "FREE",
    name: "Free",
    price: "0 €",
    period: "pour toujours",
    description: "Pour démarrer et explorer le référentiel.",
    limits: ["1 formation", "10 preuves", "3 documents", "Score simple"],
    cta: "Démarrer gratuitement",
    highlight: false,
    target: "Formateur indépendant débutant",
  },
  {
    id: "STARTER",
    name: "Starter",
    price: "49 €",
    period: "/ mois",
    description: "Pour préparer un premier audit sérieusement.",
    limits: ["5 formations", "100 preuves", "30 documents/mois", "Export audit PDF"],
    cta: "Choisir Starter",
    highlight: false,
    target: "OF en préparation initiale",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "89 €",
    period: "/ mois",
    description: "Pour les OFs actifs en maintenance continue.",
    limits: ["Formations illimitées", "Preuves illimitées", "Documents illimités", "Cockpit audit complet", "Rappels automatiques", "Assistant IA"],
    cta: "Choisir Pro",
    highlight: true,
    target: "OF certifié en surveillance",
  },
  {
    id: "CABINET",
    name: "Cabinet",
    price: "149 €",
    period: "/ mois",
    description: "Pour les consultants gérant plusieurs organismes.",
    limits: ["Tout Pro inclus", "Portefeuille clients illimité", "Tableaux de bord multi-OF", "Liens auditeur par client"],
    cta: "Choisir Cabinet",
    highlight: false,
    target: "Consultant qualité formation",
  },
];

/* ─── FAQ ─── */
const faq = [
  {
    q: "Est-ce que QualiPilot garantit la certification Qualiopi ?",
    a: "Non. QualiPilot est un outil d'organisation et de préparation. L'évaluation de la conformité reste du ressort exclusif du certificateur accrédité. Vérifiez toujours les éléments attendus dans le guide officiel RNQ.",
  },
  {
    q: "Est-ce que cela remplace un consultant qualité ?",
    a: "Non. L'outil aide à structurer le dossier et les preuves, mais ne remplace pas l'expertise d'un consultant pour interpréter les exigences ou préparer les échanges avec le certificateur.",
  },
  {
    q: "Est-ce adapté aux formateurs indépendants ?",
    a: "Oui. L'offre Free et Starter sont conçues pour les formateurs indépendants et les très petits OFs qui ont peu de formations et souhaitent organiser leur dossier simplement.",
  },
  {
    q: "Puis-je exporter un dossier pour mon audit ?",
    a: "Oui, à partir du plan Starter. L'export produit un document préparatoire structuré avec l'état des indicateurs, les preuves associées, le plan d'actions et les points manquants.",
  },
  {
    q: "Puis-je suivre plusieurs formations ?",
    a: "Oui, selon votre plan. Le plan Pro permet un nombre illimité de programmes de formation avec leurs informations publiques et preuves associées.",
  },
  {
    q: "Où sont stockées mes preuves ?",
    a: "QualiPilot stocke les métadonnées (titre, type, statut, liens) et les liens vers vos documents existants (Drive, SharePoint, URL locale). Les fichiers restent dans votre système de stockage habituel.",
  },
];

/* ─── Component ─── */
export default function Home() {
  return (
    <>
      <LandingNav />

      <main>
        {/* ── Hero ── */}
        <section className="bg-nav-bg">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-28">
            <div>
              <div
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: "rgba(21,128,61,0.15)", color: "#86efac", border: "1px solid rgba(21,128,61,0.3)" }}
              >
                SaaS français pour la conformité Qualiopi
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
                Préparez vos audits Qualiopi sans tableurs, sans dossiers éparpillés.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7" style={{ color: "#a8a49c" }}>
                QualiPilot aide les formateurs et petits organismes de formation à suivre leurs indicateurs, centraliser
                leurs preuves, générer leurs documents qualité et exporter un dossier audit structuré.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-subtle transition-colors"
                >
                  Créer mon espace qualité
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#fonctionnement"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/6"
                >
                  Voir le fonctionnement
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <p className="text-xs" style={{ color: "#706f6a" }}>
                  Aucune carte bancaire requise
                </p>
                <span style={{ color: "#3a3935" }}>·</span>
                <p className="text-xs" style={{ color: "#706f6a" }}>Sans engagement</p>
              </div>

              {/* Stats bar */}
              <div className="mt-8 flex flex-wrap gap-6 border-t pt-6" style={{ borderColor: "rgba(250,249,245,0.08)" }}>
                {[
                  { value: "32", label: "indicateurs RNQ" },
                  { value: "7", label: "critères couverts" },
                  { value: "10", label: "types de preuves" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="text-xs" style={{ color: "#706f6a" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* ── Pain points ── */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-foreground-faint">
              Ce que vous vivez avant de connaître QualiPilot
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {painPoints.map(({ icon, title, text }) => (
                <div key={title} className="rounded-xl border border-border bg-surface-subtle p-5">
                  <span className="text-2xl" role="img" aria-hidden="true">
                    {icon}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social proof ── */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-foreground-faint">
              Ce que disent les formateurs qui l&apos;utilisent
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  quote: "J'ai enfin un endroit unique pour mes preuves. Avant l'audit je savais exactement où j'en étais — c'est la première fois.",
                  name: "Sophie M.",
                  role: "Formatrice indépendante, Lyon",
                  score: "96 %",
                  scoreLabel: "au premier audit",
                },
                {
                  quote: "Le tableau de bord m'a permis d'identifier en 5 minutes les indicateurs qui me manquaient encore. Gain de temps énorme.",
                  name: "Thomas R.",
                  role: "Responsable qualité, OF de 12 formateurs",
                  score: "3 sem.",
                  scoreLabel: "de préparation",
                },
                {
                  quote: "Je gère 8 OFs en cabinet. Le mode cabinet est exactement ce qu'il me fallait — une vue consolidée, des rapports par client.",
                  name: "Nadia B.",
                  role: "Consultante qualité formation",
                  score: "8 OFs",
                  scoreLabel: "gérés simultanément",
                },
              ].map(({ quote, name, role, score, scoreLabel }) => (
                <div key={name} className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-card">
                  <p className="text-sm leading-7 text-foreground-muted">&ldquo;{quote}&rdquo;</p>
                  <div className="mt-6 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-foreground-faint">{role}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-accent">{score}</p>
                      <p className="text-[10px] text-foreground-faint">{scoreLabel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Workflow ── */}
        <section id="fonctionnement" className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Comment ça fonctionne
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">5 étapes pour passer de la dispersion à la maîtrise.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-5">
              {workflowSteps.map(({ num, icon: Icon, title, text }) => (
                <div key={num} className="flex flex-col items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tabular-nums text-foreground-faint">{num}</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Tout ce dont vous avez besoin
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">Un seul outil, centré sur la préparation et la maintenance Qualiopi.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-xl border border-border bg-background p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-foreground-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product proof ── */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Un cockpit, pas une usine à gaz
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">
                Chaque écran répond à une question : où en suis-je, qu&apos;est-ce qui manque, que faire maintenant&nbsp;?
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: "📊",
                  title: "Tableau de bord",
                  text: "Score global, critères en retard, preuves manquantes et actions urgentes d'un coup d'œil.",
                },
                {
                  icon: "📁",
                  title: "Bibliothèque de preuves",
                  text: "Chaque preuve est liée aux indicateurs concernés, avec date de validité et statut de révision.",
                },
                {
                  icon: "🧾",
                  title: "Export audit propre",
                  text: "Document structuré prêt à imprimer : état des indicateurs, preuves, actions et points à vérifier.",
                },
              ].map(({ icon, title, text }) => (
                <div key={title} className="rounded-xl border border-border bg-surface p-6 shadow-card">
                  <span className="text-2xl" aria-hidden="true">
                    {icon}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="tarifs" className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Offres et tarifs</h2>
              <p className="mt-3 text-sm text-foreground-muted">Choisissez selon votre situation. Changez à tout moment.</p>
            </div>
            <LandingPricing plans={pricingPlans} />
            <div className="hidden">
              {pricingPlans.map(({ id, name, price, period, description, limits, cta, highlight, target }) => (
                <article
                  key={id}
                  className={`relative flex flex-col rounded-xl p-6 ${
                    highlight
                      ? "shadow-raised"
                      : "border border-border bg-background shadow-card"
                  }`}
                  style={highlight ? { background: "#141413", border: "1px solid #2d2d2b" } : undefined}
                >
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow">
                        Recommandé
                      </span>
                    </div>
                  )}
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${highlight ? "text-white/40" : "text-foreground-faint"}`}>
                      {target}
                    </p>
                    <h3 className={`mt-1.5 text-lg font-semibold ${highlight ? "text-white" : "text-foreground"}`}>{name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={`text-4xl font-bold tabular-nums ${highlight ? "text-white" : "text-foreground"}`}>{price}</span>
                      <span className={`text-sm ${highlight ? "text-white/50" : "text-foreground-muted"}`}>{period}</span>
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${highlight ? "text-white/60" : "text-foreground-muted"}`}>{description}</p>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2">
                    {limits.map((limit) => (
                      <li key={limit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${highlight ? "text-accent" : "text-accent"}`}
                        />
                        <span className={highlight ? "text-white/70" : "text-foreground-muted"}>{limit}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      highlight
                        ? "bg-white text-foreground hover:bg-surface-subtle"
                        : "bg-brand text-white hover:bg-brand-hover"
                    }`}
                  >
                    {cta}
                  </Link>
                </article>
              ))}
            </div>

            {/* Pack Audit */}
            <div className="mt-5 rounded-xl border border-border bg-background p-5 md:flex md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pack Audit — 149 €</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  Accompagnement ponctuel pour la préparation d&apos;audit. Traité par contact commercial.
                </p>
              </div>
              <a
                href="mailto:contact@qualipilot.fr?subject=Pack%20Audit%20QualiPilot"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors md:mt-0"
              >
                Demander un accès
              </a>
            </div>
          </div>
        </section>

        {/* ── Trust / Disclaimer ── */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-6 py-5">
              <p className="text-sm font-semibold text-[#92400e]">Note importante</p>
              <p className="mt-1 text-sm leading-6 text-[#92400e]/80">{QUALIPILOT_DISCLAIMER}</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="border-t border-border bg-surface">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Questions fréquentes</h2>
            </div>
            <div className="mt-10 divide-y divide-border">
              {faq.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground hover:text-foreground-muted transition-colors">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-foreground-faint transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-foreground-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-nav-bg px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Votre dossier qualité mérite mieux qu&apos;un tableur de crise.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7" style={{ color: "#a8a49c" }}>
            Rejoignez les formateurs et OFs qui préparent leurs audits sereinement.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors"
            >
              Créer mon espace qualité
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-nav-bg px-6 py-8" style={{ borderTop: "1px solid rgba(250,249,245,0.08)" }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/40 md:flex-row">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="font-semibold text-white/60">QualiPilot</span>
              <span>— SaaS de préparation Qualiopi</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/mentions-legales" className="transition-colors hover:text-white/70">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="transition-colors hover:text-white/70">
                Confidentialité
              </Link>
              <Link href="/conditions-generales" className="transition-colors hover:text-white/70">
                CGU
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-white/70">
                Cookies
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
