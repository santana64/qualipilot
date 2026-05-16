import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, FileArchive, FileWarning, ShieldCheck, TrendingUp } from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { Badge, ButtonLink, Disclaimer, PageHeader, ProgressBar, SectionCard, StatCard } from "@/components/ui";
import { formatFrenchDate, formatPercent } from "@/domain/formatting";
import { requireUser } from "@/lib/auth/session";
import { indicatorStatusLabels, riskLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";

function scoreTone(score: number): "green" | "amber" | "red" {
  if (score >= 85) return "green";
  if (score >= 60) return "amber";
  return "red";
}

function badgeTone(score: number): "green" | "amber" | "red" {
  return scoreTone(score);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getWorkspaceData(user.id);

  const readinessStatus =
    data.globalReadinessScore >= 85
      ? "Votre dossier est bien avancé."
      : data.globalReadinessScore >= 60
        ? "Des indicateurs restent à compléter avant l'audit."
        : "Plusieurs points critiques nécessitent votre attention.";

  const organizationComplete = Boolean(
    data.organization?.organizationName &&
      data.organization.address &&
      data.organization.postalCode &&
      data.organization.city &&
      data.organization.activityTypes.length > 0,
  );
  const linkedEvidenceCount = data.evidences.filter((evidence) => evidence.indicatorLinks.length > 0).length;
  const criticalMissingEvidenceCount = data.missingEvidence.filter((indicator) => indicator.riskLevel === "CRITICAL").length;
  const highRiskMissingEvidenceCount = data.missingEvidence.filter((indicator) => indicator.riskLevel === "HIGH").length;

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Tableau de bord"
        description={`Niveau de préparation : ${formatPercent(data.globalReadinessScore)} — ${readinessStatus}`}
        action={
          <ButtonLink href="/app/audit/export">
            <FileArchive className="mr-1.5 h-4 w-4" />
            Exporter le dossier
          </ButtonLink>
        }
      />

      <OnboardingChecklist
        compact
        state={{
          organizationComplete,
          trainingProgramsCount: data.trainingPrograms.length,
          evidencesCount: data.evidences.length,
          linkedEvidenceCount,
          documentsCount: data.documents.length,
          auditScheduled: Boolean(data.latestAudit || data.organization?.nextAuditDate),
          globalReadinessScore: data.globalReadinessScore,
        }}
      />

      {criticalMissingEvidenceCount > 0 || data.overdueActions.length > 0 ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
              <div>
                <h2 className="font-bold text-rose-950">Points critiques avant audit</h2>
                <p className="mt-1 text-sm leading-6 text-rose-800">
                  {criticalMissingEvidenceCount} indicateur(s) critique(s) sans preuve active,{" "}
                  {highRiskMissingEvidenceCount} indicateur(s) a risque eleve sans preuve,{" "}
                  {data.overdueActions.length} action(s) en retard.
                </p>
              </div>
            </div>
            <Link
              href="/app/referentiel?missing=1"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-rose-800 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-900"
            >
              Voir les preuves manquantes
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <h2 className="font-bold text-emerald-950">Aucun point critique sans preuve active</h2>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Les indicateurs critiques sont couverts dans les donnees QualiPilot. Les exigences restent a valider selon votre situation.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── KPI row ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Niveau de préparation"
          value={formatPercent(data.globalReadinessScore)}
          detail={data.nextRecommendedAction ?? undefined}
          tone={scoreTone(data.globalReadinessScore)}
          href="/app/historique"
        />
        <StatCard
          label="Indicateurs prêts"
          value={data.indicatorsReady}
          detail="READY ou VALIDATED"
          tone="green"
          href="/app/referentiel?status=READY"
        />
        <StatCard
          label="Indicateurs incomplets"
          value={data.indicatorsIncomplete}
          detail="À compléter ou vérifier"
          tone={data.indicatorsIncomplete > 0 ? "amber" : "green"}
          href="/app/referentiel?status=IN_PROGRESS"
        />
        <StatCard
          label="Preuves manquantes"
          value={data.missingEvidence.length}
          detail="Indicateurs sans preuve active"
          tone={data.missingEvidence.length > 0 ? "amber" : "green"}
          href="/app/referentiel?missing=1"
        />
        <StatCard
          label="Actions en retard"
          value={data.overdueActions.length}
          detail="Non clôturées"
          tone={data.overdueActions.length > 0 ? "red" : "green"}
          href="/app/actions?overdue=1"
        />
        <StatCard
          label="Documents générés"
          value={data.documents.length}
          detail={`Prochain audit : ${formatFrenchDate(data.organization?.nextAuditDate)}`}
          tone="blue"
          href="/app/documents"
        />
      </section>

      {/* ── Main grid ── */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Left: criterion progression */}
        <SectionCard>
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-slate-900">Progression par critère</h2>
          </div>
          <div className="grid gap-3">
            {data.criterionScores.map(({ criterion, score, readyCount, totalCount }) => (
              <Link
                href={`/app/referentiel?criterion=${criterion.number}`}
                key={criterion.id}
                className="group rounded-lg border border-border p-4 transition-colors hover:border-brand/20 hover:bg-brand-subtle"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Critère {criterion.number} — {criterion.title}
                  </p>
                  <Badge tone={badgeTone(score)}>{formatPercent(score)}</Badge>
                </div>
                <div className="mt-3">
                  <ProgressBar value={score} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {readyCount}/{totalCount} indicateurs prêts
                </p>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Right: urgent items */}
        <div className="grid gap-6 content-start">
          {/* Overdue actions */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h2 className="font-bold text-slate-900">Actions en retard</h2>
            </div>
            <div className="grid gap-2">
              {data.overdueActions.slice(0, 5).map((action) => (
                <Link
                  key={action.id}
                  href="/app/actions"
                  className="rounded-lg bg-rose-50 p-3 text-sm transition hover:bg-rose-100"
                >
                  <span className="block font-semibold text-rose-900">{action.title}</span>
                  <span className="text-rose-700">Échéance : {formatFrenchDate(action.dueDate)}</span>
                </Link>
              ))}
              {data.overdueActions.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Aucune action en retard.
                </div>
              ) : null}
              {data.overdueActions.length > 5 ? (
                <Link href="/app/actions?overdue=1" className="text-xs font-semibold text-brand hover:underline">
                  Voir toutes les actions en retard ({data.overdueActions.length})
                </Link>
              ) : null}
            </div>
          </SectionCard>

          {/* Missing evidence */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-amber-600" />
              <h2 className="font-bold text-slate-900">Preuves manquantes</h2>
            </div>
            <div className="grid gap-2">
              {data.missingEvidence.slice(0, 5).map((indicator) => (
                <Link
                  key={indicator.id}
                  href={`/app/referentiel/${indicator.id}`}
                  className="rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-900">Indicateur {indicator.number}</span>
                  <span className="block text-slate-600">{indicator.title}</span>
                </Link>
              ))}
              {data.missingEvidence.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Toutes les preuves actives sont associées.
                </div>
              ) : null}
              {data.missingEvidence.length > 5 ? (
                <Link href="/app/preuves" className="text-xs font-semibold text-brand hover:underline">
                  Voir toutes les preuves manquantes
                </Link>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </section>

      {/* ── Audit + critical indicators ── */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Next audit */}
        <SectionCard>
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-slate-900">Prochain audit</h2>
          </div>
          <p className="text-2xl font-black text-slate-950">
            {formatFrenchDate(data.latestAudit?.scheduledDate ?? data.organization?.nextAuditDate)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {data.latestAudit?.certifierName ?? data.organization?.certifierName ?? "Certificateur à renseigner"}
          </p>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <ButtonLink href="/app/audit" variant="secondary" size="sm">
              Ouvrir le cockpit audit
            </ButtonLink>
          </div>
        </SectionCard>

        {/* Critical indicators */}
        <SectionCard className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-slate-900">Indicateurs critiques à vérifier</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.criticalIndicators.slice(0, 6).map((indicator) => (
              <Link
                key={indicator.id}
                href={`/app/referentiel/${indicator.id}`}
                className="rounded-lg border border-border p-3 text-sm transition hover:border-brand/20 hover:bg-brand-subtle"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900">#{indicator.number}</span>
                  <Badge tone={indicator.riskLevel === "CRITICAL" ? "red" : "amber"}>
                    {riskLabels[indicator.riskLevel]}
                  </Badge>
                </div>
                <p className="mt-2 text-slate-700">{indicator.title}</p>
                <p className="mt-1 text-xs text-slate-500">{indicatorStatusLabels[indicator.status]}</p>
              </Link>
            ))}
            {data.criticalIndicators.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Aucun indicateur critique détecté.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <Disclaimer>
        À vérifier selon votre situation et le guide officiel RNQ. QualiPilot ne garantit pas la certification.
      </Disclaimer>
    </main>
  );
}
