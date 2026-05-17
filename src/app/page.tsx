import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  FileArchive,
  FolderOpen,
  ListChecks,
  Layers,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { LandingPricing } from "@/components/landing-pricing";

/* ─── Nav ─────────────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-20 bg-nav-bg/95 backdrop-blur" style={{ borderBottom: "1px solid rgba(250,249,245,0.08)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span className="text-[15px] font-bold tracking-tight text-white">QualiPilot</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {[["#comment", "Fonctionnement"], ["#fonctionnalites", "Fonctionnalités"], ["#tarifs", "Tarifs"], ["#faq", "FAQ"]].map(([href, label]) => (
            <a key={href} href={href} className="text-sm transition-colors hover:text-white" style={{ color: "#a8a49c" }}>{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: "#a8a49c" }}>Se connecter</Link>
          <Link href="/register" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors">
            Essai gratuit
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero preview ─────────────────────────────────────────────────────────── */
function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-2xl opacity-20" style={{ background: "radial-gradient(circle, #15803d 0%, transparent 70%)" }} />
      <div className="relative rounded-xl bg-surface p-5 shadow-float ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-faint">Niveau de préparation</p>
            <p className="mt-0.5 text-3xl font-bold text-foreground">82 %</p>
          </div>
          <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1 text-xs font-medium text-[#92400e]">
            À surveiller
          </span>
        </div>
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
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-2.5 text-xs font-medium text-[#991b1b]">5 preuves à vérifier</div>
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-xs font-medium text-[#92400e]">2 actions en retard</div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-xs font-semibold text-white">
          <FileArchive className="h-3.5 w-3.5" />
          Exporter le dossier audit
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing plans ────────────────────────────────────────────────────────── */
const pricingPlans = [
  {
    id: "FREE", name: "Free", price: "0 €", period: "pour toujours",
    description: "Pour explorer le référentiel et démarrer.",
    limits: ["1 formation", "10 preuves", "3 documents/mois", "Tableau de bord score"],
    cta: "Démarrer gratuitement", highlight: false, target: "Formateur indépendant débutant",
  },
  {
    id: "STARTER", name: "Starter", price: "49 €", period: "/ mois",
    description: "Pour préparer un premier audit sérieusement.",
    limits: ["5 formations", "100 preuves", "30 documents/mois", "Export dossier PDF"],
    cta: "Choisir Starter", highlight: false, target: "OF en préparation initiale",
  },
  {
    id: "PRO", name: "Pro", price: "89 €", period: "/ mois",
    description: "Pour les OFs actifs en maintenance continue.",
    limits: ["Formations illimitées", "Preuves illimitées", "Documents illimités", "Assistant IA + Simulateur audit", "Benchmark + Veille RNQ", "Rappels automatiques"],
    cta: "Choisir Pro", highlight: true, target: "OF certifié en surveillance",
  },
  {
    id: "CABINET", name: "Cabinet", price: "149 €", period: "/ mois",
    description: "Pour les consultants gérant plusieurs organismes.",
    limits: ["Tout Pro inclus", "Portefeuille clients illimité", "Tableaux de bord multi-OF", "Liens auditeur par client"],
    cta: "Choisir Cabinet", highlight: false, target: "Consultant qualité formation",
  },
];

/* ─── FAQ ──────────────────────────────────────────────────────────────────── */
const faq = [
  { q: "Le simulateur d'audit IA fonctionne comment ?", a: "L'IA analyse vos indicateurs réels, sélectionne les 12 plus risqués et joue le rôle d'un auditeur (AFNOR, Bureau Veritas, ICPF). Vous répondez à ses questions, elle évalue vos réponses et produit un rapport avec vos lacunes et recommandations précises." },
  { q: "Est-ce que QualiPilot garantit la certification Qualiopi ?", a: "Non. QualiPilot est un outil d'organisation et de préparation. L'évaluation de la conformité reste du ressort exclusif du certificateur accrédité. Vérifiez toujours les éléments attendus dans le guide officiel RNQ." },
  { q: "Est-ce adapté aux formateurs indépendants ?", a: "Oui. L'offre Free et Starter sont conçues pour les formateurs indépendants et les très petits OFs. Démarrez gratuitement, sans carte bancaire." },
  { q: "Puis-je gérer plusieurs organismes de formation ?", a: "Oui, avec le plan Cabinet. Un tableau de bord consolidé, des rapports par client et des liens de partage en lecture seule pour chaque certificateur." },
  { q: "La veille RNQ surveille quoi exactement ?", a: "QualiPilot scrute automatiquement les sources officielles du Référentiel National Qualité. Si un changement est détecté, l'IA analyse l'impact sur vos indicateurs et vous envoie un email avec les actions à prendre." },
  { q: "Où sont stockées mes données et preuves ?", a: "Vos données sont hébergées en Europe (Neon PostgreSQL, Vercel). Les fichiers preuves sont stockés sur Vercel Blob (infrastructure AWS Europe). Vous pouvez aussi lier des fichiers Drive ou SharePoint sans les déplacer." },
  { q: "Puis-je exporter un dossier pour mon certificateur ?", a: "Oui, à partir du plan Starter. L'export produit un PDF structuré : état des indicateurs, preuves, formations, plan d'actions et points manquants." },
];

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Nav />
      <main>

        {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="bg-nav-bg">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-28">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                style={{ background: "rgba(21,128,61,0.12)", color: "#86efac", borderColor: "rgba(21,128,61,0.25)" }}>
                <Sparkles className="h-3 w-3" />
                Simulateur d'audit IA · Benchmark · Veille RNQ
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-white lg:text-[3.2rem]">
                Décrochez Qualiopi.<br />
                <span style={{ color: "#86efac" }}>Sans stress,</span> sans tableurs.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7" style={{ color: "#a8a49c" }}>
                QualiPilot centralise vos preuves, suit vos 32 indicateurs RNQ, simule vos audits avec l'IA et vous alerte si le référentiel change — tout dans un seul outil.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow hover:bg-surface-subtle transition-colors">
                  Essayer gratuitement — sans carte
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#comment"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition-colors">
                  Voir comment ça marche
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs" style={{ color: "#706f6a" }}>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 2 minutes pour démarrer</span>
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-accent" /> Hébergé en Europe</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" /> Sans engagement</span>
              </div>

              {/* Stats */}
              <div className="mt-8 flex flex-wrap gap-8 border-t pt-6" style={{ borderColor: "rgba(250,249,245,0.08)" }}>
                {[
                  { value: "32", label: "indicateurs RNQ" },
                  { value: "IA", label: "simulateur audit" },
                  { value: "47+", label: "OFs en préparation", live: true },
                ].map(({ value, label, live }) => (
                  <div key={label}>
                    <div className="flex items-center gap-1.5">
                      <p className="text-2xl font-black text-white">{value}</p>
                      {live && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#86efac" }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#86efac" }} /></span>}
                    </div>
                    <p className="text-xs" style={{ color: "#706f6a" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* ═══ URGENCE ══════════════════════════════════════════════════════ */}
        <div className="border-y border-border bg-surface-raised">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <p className="text-center text-sm text-foreground-muted">
              <span className="font-semibold text-foreground">100 000 organismes de formation</span> doivent maintenir leur certification Qualiopi pour accéder aux financements OPCO et CPF.{" "}
              <span className="font-semibold text-foreground">Les audits de surveillance ne s'attendent pas.</span>
            </p>
          </div>
        </div>

        {/* ═══ PAIN POINTS ══════════════════════════════════════════════════ */}
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-foreground-faint">
              Ce que vous vivez sans QualiPilot
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: "📂", title: "Preuves introuvables", text: "Impossible de savoir quelles preuves manquent ni où se trouvent les dernières versions." },
                { icon: "📊", title: "Suivi en tableur", text: "Les indicateurs RNQ vivent dans des fichiers Excel dispersés, jamais à jour." },
                { icon: "😰", title: "Panique avant l'audit", text: "Les points manquants se découvrent deux semaines avant le rendez-vous avec le certificateur." },
                { icon: "🔄", title: "Amélioration non tracée", text: "Les actions correctives s'ouvrent mais ne se clôturent jamais avec une preuve documentée." },
              ].map(({ icon, title, text }) => (
                <div key={title} className="rounded-xl border border-border bg-background p-5">
                  <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ DIFFÉRENCIATEURS IA ══════════════════════════════════════════ */}
        <section className="bg-nav-bg">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-5"
                style={{ background: "rgba(21,128,61,0.12)", color: "#86efac", borderColor: "rgba(21,128,61,0.25)" }}>
                <Sparkles className="h-3 w-3" />
                Fonctionnalités exclusives
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Ce qu'aucun autre outil ne fait
              </h2>
              <p className="mt-3 text-sm" style={{ color: "#a8a49c" }}>
                Trois fonctionnalités IA pensées pour les OFs qui veulent garder un coup d'avance.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Bot,
                  color: "#818cf8",
                  bg: "rgba(129,140,248,0.1)",
                  border: "rgba(129,140,248,0.2)",
                  badge: "Simulateur d'audit IA",
                  title: "Entraînez-vous avant le vrai audit",
                  text: "L'IA joue le rôle d'un auditeur (AFNOR, Bureau Veritas, ICPF). Elle analyse vos indicateurs réels, pose les vraies questions et évalue vos réponses. Rapport de lacunes personnalisé à la clé.",
                },
                {
                  icon: BarChart3,
                  color: "#34d399",
                  bg: "rgba(52,211,153,0.1)",
                  border: "rgba(52,211,153,0.2)",
                  badge: "Benchmark anonymisé",
                  title: "Comparez-vous aux OFs similaires",
                  text: "Voyez où vous vous situez par rapport aux organismes de même taille et secteur. Identifiez les indicateurs où vous êtes le plus en retard par rapport à la moyenne.",
                },
                {
                  icon: Bell,
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.1)",
                  border: "rgba(245,158,11,0.2)",
                  badge: "Veille RNQ automatique",
                  title: "Soyez alerté avant tout le monde",
                  text: "QualiPilot surveille les sources officielles du Référentiel National Qualité. Si quelque chose change, l'IA analyse l'impact sur vos indicateurs et vous envoie un email d'alerte précis.",
                },
              ].map(({ icon: Icon, color, bg, border, badge, title, text }) => (
                <div key={badge} className="flex flex-col rounded-xl p-6" style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <span className="mt-4 text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                    {badge}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "#a8a49c" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF ═════════════════════════════════════════════════ */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-foreground-faint">
              Ce que disent les formateurs
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                { quote: "Enfin un endroit unique pour mes preuves. Avant l'audit je savais exactement où j'en étais — c'est la première fois que j'arrivais sereine.", name: "Sophie M.", role: "Formatrice indépendante, Lyon", stat: "96 %", statLabel: "au premier audit" },
                { quote: "Le tableau de bord m'a permis d'identifier en 5 minutes les indicateurs qui me manquaient encore. Le simulateur IA m'a préparée aux vraies questions.", name: "Thomas R.", role: "Responsable qualité, OF 12 formateurs", stat: "3 sem.", statLabel: "de préparation" },
                { quote: "Je gère 8 OFs en cabinet. Le mode cabinet est exactement ce qu'il me fallait : une vue consolidée, des rapports par client, des liens pour les certificateurs.", name: "Nadia B.", role: "Consultante qualité formation", stat: "8 OFs", statLabel: "gérés simultanément" },
              ].map(({ quote, name, role, stat, statLabel }) => (
                <div key={name} className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-card">
                  <p className="text-sm leading-7 text-foreground-muted">&ldquo;{quote}&rdquo;</p>
                  <div className="mt-6 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-foreground-faint">{role}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-accent">{stat}</p>
                      <p className="text-[10px] text-foreground-faint">{statLabel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ COMMENT ÇA MARCHE ════════════════════════════════════════════ */}
        <section id="comment" className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Comment ça fonctionne</h2>
              <p className="mt-3 text-sm text-foreground-muted">5 étapes pour passer de la dispersion à la maîtrise.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-5">
              {([
                { num: "01", icon: ShieldCheck, title: "Cadrez votre organisme", text: "Profil, statut Qualiopi, prochaine échéance et activités concernées." },
                { num: "02", icon: BookOpen,    title: "Suivez les 32 indicateurs", text: "Statuts, risques et preuves associées aux 7 critères RNQ." },
                { num: "03", icon: FolderOpen,  title: "Centralisez vos preuves", text: "Liez chaque preuve aux indicateurs et suivez leur validité." },
                { num: "04", icon: ListChecks,  title: "Traitez les écarts", text: "Actions priorisées, responsables, clôtures avec preuve." },
                { num: "05", icon: FileArchive, title: "Exportez le dossier", text: "Synthèse structurée prête pour le certificateur." },
              ] as Array<{ num: string; icon: LucideIcon; title: string; text: string }>).map(({ num, icon: Icon, title, text }) => (
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

        {/* ═══ FONCTIONNALITÉS ══════════════════════════════════════════════ */}
        <section id="fonctionnalites" className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Tout ce dont vous avez besoin</h2>
              <p className="mt-3 text-sm text-foreground-muted">Un seul outil, centré sur la préparation et la maintenance Qualiopi.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {([
                { icon: BookOpen,      title: "Référentiel RNQ structuré",       text: "Les 7 critères et 32 indicateurs Qualiopi avec statuts, risques et preuves attendues." },
                { icon: FolderOpen,   title: "Bibliothèque de preuves",          text: "Centralisez procédures, programmes, émargements, évaluations, CV et questionnaires." },
                { icon: ListChecks,   title: "Plan d'amélioration continue",     text: "Actions priorisées, responsables, échéances et clôtures documentées liées aux indicateurs." },
                { icon: Layers,       title: "Programmes de formation",          text: "Gérez les informations publiques et qualité de chaque programme avec un score de complétude." },
                { icon: LayoutDashboard, title: "Cockpit audit",                 text: "Vue globale du niveau de préparation, des points critiques et des prochaines échéances." },
                { icon: FileArchive,  title: "Export dossier PDF",               text: "Document structuré et imprimable avec indicateurs, preuves, actions et points manquants." },
              ] as Array<{ icon: LucideIcon; title: string; text: string }>).map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
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

        {/* ═══ TARIFS ════════════════════════════════════════════════════════ */}
        <section id="tarifs" className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Offres et tarifs</h2>
              <p className="mt-3 text-sm text-foreground-muted">Commencez gratuitement. Évoluez selon vos besoins.</p>
            </div>
            <LandingPricing plans={pricingPlans} />
            {/* Pack Audit */}
            <div className="mt-5 rounded-xl border border-border bg-background p-5 md:flex md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pack Audit ponctuel — 149 €</p>
                <p className="mt-1 text-sm text-foreground-muted">Accompagnement sur mesure pour la préparation d'un audit. Contactez-nous.</p>
              </div>
              <a href="mailto:contact@qualipilot.pro?subject=Pack%20Audit%20QualiPilot"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors md:mt-0">
                Demander un accès
              </a>
            </div>
          </div>
        </section>

        {/* ═══ TRUST SIGNALS ════════════════════════════════════════════════ */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Lock,         title: "Données sécurisées",     text: "Hébergement Europe, chiffrement TLS, accès RBAC par rôle." },
                { icon: ShieldCheck,  title: "Conforme RGPD",          text: "Aucune revente de données. Suppression sur demande sous 30 jours." },
                { icon: Zap,          title: "Mis à jour en continu",  text: "Nouvelles fonctionnalités déployées chaque semaine." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-foreground-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FAQ ══════════════════════════════════════════════════════════ */}
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

        {/* ═══ FINAL CTA ════════════════════════════════════════════════════ */}
        <section className="bg-nav-bg px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Votre prochain audit commence aujourd&apos;hui.
            </h2>
            <p className="mx-auto mt-4 text-sm leading-7" style={{ color: "#a8a49c" }}>
              Rejoignez les <span className="font-semibold text-white">47 OFs</span> qui préparent leurs audits sereinement — sans tableurs, sans panique de dernière minute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors shadow">
                Essayer gratuitement — sans carte
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: "#706f6a" }}>
              2 minutes pour démarrer · Aucune carte bancaire · Sans engagement
            </p>
          </div>
        </section>

        {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer className="bg-nav-bg px-6 py-8" style={{ borderTop: "1px solid rgba(250,249,245,0.08)" }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs md:flex-row" style={{ color: "rgba(250,249,245,0.35)" }}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="font-semibold" style={{ color: "rgba(250,249,245,0.6)" }}>QualiPilot</span>
              <span>— Préparation Qualiopi assistée par IA</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                ["/mentions-legales", "Mentions légales"],
                ["/confidentialite", "Confidentialité"],
                ["/conditions-generales", "CGU"],
                ["/cookies", "Cookies"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="transition-colors hover:text-white/70">{label}</Link>
              ))}
            </nav>
          </div>
        </footer>

      </main>
    </>
  );
}
