import Link from "next/link";
import {
  Building2,
  BookOpen,
  FileStack,
  Link2,
  FileText,
  CalendarCheck,
  PartyPopper,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getWorkspaceData } from "@/server/app-data";
import { getOnboardingSteps, type OnboardingState } from "@/components/onboarding-checklist";

const stepIcons = [Building2, BookOpen, FileStack, Link2, FileText, CalendarCheck];

const stepDetails = [
  {
    tip: "Un profil complet rassure l'auditeur dès la première page du dossier.",
    ctaLabel: "Compléter le profil →",
  },
  {
    tip: "Chaque formation doit décrire le public visé, les objectifs pédagogiques et les modalités d'évaluation.",
    ctaLabel: "Ajouter une formation →",
  },
  {
    tip: "Commencez avec 3 preuves clés : règlement intérieur, programme de formation, questionnaire d'évaluation.",
    ctaLabel: "Déposer des preuves →",
  },
  {
    tip: "Le référentiel indique en temps réel quels indicateurs manquent encore de preuves.",
    ctaLabel: "Ouvrir le référentiel →",
  },
  {
    tip: "QualiPilot génère automatiquement les documents obligatoires à partir de vos données.",
    ctaLabel: "Générer des documents →",
  },
  {
    tip: "Le cockpit audit calcule votre score de préparation et identifie les points bloquants.",
    ctaLabel: "Préparer l'audit →",
  },
];

function ProgressBar({ current, total, completed }: { current: number; total: number; completed: boolean[] }) {
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between text-xs text-foreground-faint">
        <span>Étape {Math.min(current, total)} sur {total}</span>
        <span>{completed.filter(Boolean).length} complétées</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              completed[i]
                ? "bg-accent"
                : i === current - 1
                  ? "bg-brand"
                  : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const data = await getWorkspaceData(user.id);
  const linkedEvidenceCount = data.evidences.filter((e) => e.indicatorLinks.length > 0).length;

  const state: OnboardingState = {
    organizationComplete: Boolean(
      data.organization?.organizationName &&
        data.organization.address &&
        data.organization.postalCode &&
        data.organization.city &&
        data.organization.activityTypes.length > 0,
    ),
    trainingProgramsCount: data.trainingPrograms.length,
    evidencesCount: data.evidences.length,
    linkedEvidenceCount,
    documentsCount: data.documents.length,
    auditScheduled: Boolean(data.latestAudit || data.organization?.nextAuditDate),
    globalReadinessScore: data.globalReadinessScore,
  };

  const steps = getOnboardingSteps(state);
  const completedFlags = steps.map((s) => s.done);
  const allDone = completedFlags.every(Boolean);

  const params = (await searchParams) ?? {};
  const rawStep = typeof params.step === "string" ? parseInt(params.step, 10) : 1;
  const currentStep = Math.max(1, Math.min(rawStep, steps.length));
  const step = steps[currentStep - 1];
  const Icon = stepIcons[currentStep - 1];
  const detail = stepDetails[currentStep - 1];

  const nextStep = currentStep < steps.length ? currentStep + 1 : null;
  const prevStep = currentStep > 1 ? currentStep - 1 : null;

  if (allDone) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <PartyPopper className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Espace qualité initialisé 🎉</h1>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">
            Vous avez complété les 6 étapes fondamentales. Votre dossier RNQ est maintenant exploitable.
            Continuez à enrichir vos preuves et à maintenir votre score de préparation.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-5 py-2.5">
            <span className="text-3xl font-black text-accent">{state.globalReadinessScore}%</span>
            <span className="text-sm text-foreground-muted">de préparation globale</span>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Aller au tableau de bord →
            </Link>
            <Link
              href="/app/audit"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-subtle"
            >
              Préparer l&apos;audit
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <ProgressBar current={currentStep} total={steps.length} completed={completedFlags} />

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
          {/* Step icon */}
          <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.done ? "bg-accent/10" : "bg-brand/10"}`}>
            {step.done ? (
              <CheckCircle2 className="h-8 w-8 text-accent" />
            ) : (
              <Icon className="h-8 w-8 text-brand" />
            )}
          </div>

          {/* Step label */}
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground-faint">
            Étape {currentStep} — {step.done ? "Complétée ✓" : "À faire"}
          </p>

          {/* Title */}
          <h1 className="mt-2 text-xl font-bold text-foreground">{step.title}</h1>

          {/* Description */}
          <p className="mt-2 text-sm leading-7 text-foreground-muted">{step.description}</p>

          {/* Pro tip */}
          <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            <strong>Conseil :</strong> {detail.tip}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-col gap-3">
            <Link
              href={step.href}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              {detail.ctaLabel}
            </Link>

            {nextStep && (
              <Link
                href={`/app/onboarding?step=${nextStep}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground-muted transition hover:bg-surface-subtle hover:text-foreground"
              >
                Passer cette étape <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Step nav */}
        <div className="mt-6 flex items-center justify-between text-sm text-foreground-faint">
          {prevStep ? (
            <Link href={`/app/onboarding?step=${prevStep}`} className="transition hover:text-foreground">
              ← Étape précédente
            </Link>
          ) : (
            <span />
          )}
          <Link href="/app" className="transition hover:text-foreground">
            Revenir au tableau de bord
          </Link>
        </div>

        {/* All steps quick nav */}
        <div className="mt-8 grid grid-cols-6 gap-1.5">
          {steps.map((s, i) => {
            const StepIcon = stepIcons[i];
            const isActive = i + 1 === currentStep;
            return (
              <Link
                key={s.href}
                href={`/app/onboarding?step=${i + 1}`}
                title={s.title}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                  isActive
                    ? "border-brand bg-brand/5"
                    : s.done
                      ? "border-accent/20 bg-accent/5"
                      : "border-border hover:bg-surface-subtle"
                }`}
              >
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                ) : (
                  <StepIcon className={`h-4 w-4 ${isActive ? "text-brand" : "text-foreground-faint"}`} />
                )}
                <span className="text-[10px] leading-3 text-foreground-faint">{i + 1}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
