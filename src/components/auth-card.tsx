import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Notice } from "@/components/ui";

const brandFeatures = [
  "32 indicateurs RNQ couverts, critère par critère",
  "Bibliothèque de preuves liée aux indicateurs",
  "Score de préparation en temps réel",
  "Dossier audit exportable en un clic",
];

function HeroMiniPreview() {
  return (
    <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#706f6a" }}>
            Niveau de préparation
          </p>
          <p className="mt-0.5 text-2xl font-bold text-white">82 %</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: "rgba(253,230,138,0.15)", color: "#fde68a", border: "1px solid rgba(253,230,138,0.25)" }}
        >
          À surveiller
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {[
          { label: "Critère 1 — Information des publics", score: 92, color: "#22c55e" },
          { label: "Critère 3 — Évaluation", score: 76, color: "#f59e0b" },
          { label: "Critère 6 — Accessibilité", score: 54, color: "#f87171" },
        ].map(({ label, score, color }) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-[11px]" style={{ color: "#706f6a" }}>
              <span>{label}</span>
              <span className="font-semibold text-white">{score} %</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-1 rounded-full" style={{ width: `${score}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthCard({
  title,
  description,
  children,
  error,
  message,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string | string[];
  message?: string | string[];
}) {
  return (
    <main className="flex min-h-screen bg-background">
      {/* ── Left branding panel ── */}
      <div className="hidden w-[440px] shrink-0 flex-col justify-between bg-nav-bg px-10 py-12 lg:flex">
        <div>
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="text-[15px] font-bold tracking-tight text-white">QualiPilot</span>
          </Link>

          {/* Headline */}
          <div className="mt-12">
            <p className="text-[26px] font-semibold leading-[1.3] tracking-tight text-white">
              Préparez votre audit Qualiopi sans stress.
            </p>
            <p className="mt-4 text-sm leading-7" style={{ color: "#a8a49c" }}>
              Centralisez vos preuves, suivez vos 32 indicateurs RNQ et exportez un dossier structuré — en quelques
              minutes, pas en quelques jours.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="mt-8 space-y-3">
            {brandFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#c9c4bb" }}>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                {f}
              </li>
            ))}
          </ul>

          {/* Mini preview */}
          <HeroMiniPreview />
        </div>

        {/* Bottom disclaimer */}
        <p className="mt-8 text-xs leading-6" style={{ color: "#4d4c48" }}>
          À vérifier selon votre situation et le guide officiel RNQ. QualiPilot ne garantit pas la certification.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="text-[15px] font-bold tracking-tight text-foreground">QualiPilot</span>
          </Link>

          {/* Title */}
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{description}</p>

          {/* Alerts */}
          {(error || message) && (
            <div className="mt-5 grid gap-3">
              <Notice message={error} type="error" />
              <Notice message={message} type="success" />
            </div>
          )}

          {/* Form */}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </main>
  );
}
