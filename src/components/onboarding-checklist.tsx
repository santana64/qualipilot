import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { SectionCard } from "@/components/ui";

export type OnboardingState = {
  organizationComplete: boolean;
  trainingProgramsCount: number;
  evidencesCount: number;
  linkedEvidenceCount: number;
  documentsCount: number;
  auditScheduled: boolean;
  globalReadinessScore: number;
};

export function getOnboardingSteps(state: OnboardingState) {
  return [
    {
      title: "Completer le profil organisme",
      description: "Nom, adresse, activites, statut Qualiopi et prochaine date d'audit.",
      href: "/app/settings",
      done: state.organizationComplete,
    },
    {
      title: "Ajouter au moins une formation",
      description: "Programme, public, objectifs, modalites, evaluation et accessibilite.",
      href: "/app/formations/new",
      done: state.trainingProgramsCount > 0,
    },
    {
      title: "Centraliser les premieres preuves",
      description: "Procedures, questionnaires, attestations, programmes ou preuves publiques.",
      href: "/app/preuves",
      done: state.evidencesCount >= 3,
    },
    {
      title: "Relier les preuves aux indicateurs RNQ",
      description: "Chaque indicateur important doit pointer vers un element de preuve actif.",
      href: "/app/referentiel",
      done: state.linkedEvidenceCount > 0,
    },
    {
      title: "Generer les documents qualite de base",
      description: "Accueil apprenant, handicap, evaluation et plan d'amelioration continue.",
      href: "/app/documents",
      done: state.documentsCount >= 3,
    },
    {
      title: "Planifier le cockpit audit",
      description: "Date, type d'audit, points manquants et dossier exportable.",
      href: "/app/audit",
      done: state.auditScheduled,
    },
  ];
}

export function OnboardingChecklist({ state, compact = false }: { state: OnboardingState; compact?: boolean }) {
  const steps = getOnboardingSteps(state);
  const completed = steps.filter((step) => step.done).length;
  const isDone = completed === steps.length;

  if (compact && isDone) return null;

  return (
    <SectionCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-faint">Demarrage guide</p>
          <h2 className="mt-1 text-lg font-bold text-foreground">
            {isDone ? "Espace qualite initialise" : "Votre prochain meilleur pas"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
            {completed}/{steps.length} etapes terminees. Objectif : obtenir un dossier RNQ exploitable avant de chercher
            la perfection.
          </p>
        </div>
        <Link
          href="/app/onboarding"
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle"
        >
          Ouvrir le guide
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className={compact ? "mt-5 grid gap-3 md:grid-cols-3" : "mt-6 grid gap-3"}>
        {steps.map((step) => (
          <Link
            key={step.href + step.title}
            href={step.href}
            className="flex items-start gap-3 rounded-lg border border-border p-3 transition hover:bg-brand-subtle"
          >
            {step.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-foreground-faint" />
            )}
            <span>
              <span className="block text-sm font-semibold text-foreground">{step.title}</span>
              {!compact ? (
                <span className="mt-0.5 block text-xs leading-5 text-foreground-muted">{step.description}</span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
