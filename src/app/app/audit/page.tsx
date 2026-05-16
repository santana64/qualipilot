import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileArchive, ShieldCheck } from "lucide-react";
import { Badge, Disclaimer, Field, PageHeader, ProgressBar, SectionCard, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { formatFrenchDate, formatPercent } from "@/domain/formatting";
import { getAuditReadinessStatus } from "@/domain/rnq/readiness";
import { auditTypeLabels, riskLabels } from "@/lib/labels";
import { prisma } from "@/lib/db";
import { getWorkspaceData } from "@/server/app-data";
import { saveAuditRecordAction } from "@/server/actions/audit";
import { createAuditorShareLinkAction, revokeAuditorShareLinkAction } from "@/server/actions/auditor-share";
import { getWorkspaceContext, roleAllows } from "@/server/rbac";

type ReadinessStatus = "READY" | "WARNING" | "AT_RISK" | "CRITICAL";

function readinessLabel(score: number): { label: string; tone: "green" | "amber" | "red" } {
  const status = getAuditReadinessStatus(score) as ReadinessStatus;
  const map: Record<ReadinessStatus, { label: string; tone: "green" | "amber" | "red" }> = {
    READY: { label: "Prêt", tone: "green" },
    WARNING: { label: "À surveiller", tone: "amber" },
    AT_RISK: { label: "À risque", tone: "red" },
    CRITICAL: { label: "Critique", tone: "red" },
  };
  return map[status] ?? { label: "Inconnu", tone: "amber" };
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await getWorkspaceContext();
  const params = (await searchParams) ?? {};
  const data = await getWorkspaceData(workspace.workspaceUserId);
  const canManageAudit = roleAllows(workspace.role, "manageAudit");
  const canCreateShare = roleAllows(workspace.role, "createAuditorShare");
  const shareLinks = await prisma.auditorShareLink.findMany({
    where: { userId: workspace.workspaceUserId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const audit = data.latestAudit;
  const { label: statusLabel, tone: statusTone } = readinessLabel(data.globalReadinessScore);
  const criticalMissing = data.missingEvidence.filter((item) => item.riskLevel === "CRITICAL").length;

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Cockpit audit"
        description="État de préparation, points bloquants et export du dossier préparatoire."
        action={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
            href="/app/audit/export"
          >
            <FileArchive className="h-4 w-4" />
            Exporter le dossier
          </Link>
        }
      />
      {typeof params.success === "string" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {params.success}
          {typeof params.shareUrl === "string" ? (
            <div className="mt-2 break-all rounded-md bg-white/70 px-3 py-2 font-mono text-xs text-emerald-900">
              {params.shareUrl}
            </div>
          ) : null}
        </div>
      ) : null}
      {typeof params.error === "string" ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{params.error}</div>
      ) : null}

      {/* ── Top status ── */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-surface p-6 shadow-card md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Niveau de préparation</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatPercent(data.globalReadinessScore)}</p>
          <div className="mt-4">
            <ProgressBar value={data.globalReadinessScore} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Badge tone={statusTone}>{statusLabel}</Badge>
            <span className="text-sm text-slate-500">
              {data.indicatorsReady}/{data.indicatorsReady + data.indicatorsIncomplete} indicateurs prêts
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-surface p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preuves critiques manquantes</p>
          <p className={`mt-2 text-4xl font-black ${criticalMissing > 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {criticalMissing}
          </p>
          {criticalMissing > 0 ? (
            <p className="mt-2 text-xs text-rose-600">Indicateurs CRITICAL sans preuve active</p>
          ) : (
            <p className="mt-2 text-xs text-emerald-600">Tous les indicateurs critiques sont couverts</p>
          )}
        </div>
        <div className="rounded-xl bg-surface p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions en retard</p>
          <p className={`mt-2 text-4xl font-black ${data.overdueActions.length > 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {data.overdueActions.length}
          </p>
          {data.overdueActions.length > 0 ? (
            <p className="mt-2 text-xs text-rose-600">À clôturer avant l&apos;audit</p>
          ) : (
            <p className="mt-2 text-xs text-emerald-600">Aucune action en retard</p>
          )}
        </div>
      </section>

      {/* ── Main grid ── */}
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Audit context form */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Contexte de l&apos;audit</h2>
          <form action={saveAuditRecordAction} className="grid gap-4">
            {audit ? <input type="hidden" name="id" value={audit.id} /> : null}
            <Field label="Type d'audit">
              <select className={inputClass} name="type" defaultValue={audit?.type ?? "INITIAL"}>
                {Object.entries(auditTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {data.cabinetClients.length > 0 ? (
              <Field label="Client cabinet">
                <select className={inputClass} name="clientId" defaultValue={audit?.clientId ?? ""}>
                  <option value="">Aucun client</option>
                  {data.cabinetClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organizationName}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Date prévue" required>
              <input
                className={inputClass}
                name="scheduledDate"
                type="date"
                defaultValue={audit?.scheduledDate ? audit.scheduledDate.toISOString().slice(0, 10) : ""}
                required
              />
            </Field>
            <Field label="Certificateur">
              <input
                className={inputClass}
                name="certifierName"
                defaultValue={audit?.certifierName ?? data.organization?.certifierName ?? ""}
                placeholder="Ex. : Bureau Veritas, Afnor..."
              />
            </Field>
            <Field label="Statut">
              <select className={inputClass} name="status" defaultValue={audit?.status ?? "PLANNED"}>
                <option value="PLANNED">Planifié</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </Field>
            <Field label="Notes audit">
              <textarea
                className={textareaClass}
                name="notes"
                defaultValue={audit?.notes ?? ""}
                placeholder="Points de vigilance, contacts, documents à préparer..."
              />
            </Field>
            {canManageAudit ? (
              <SubmitButton>Enregistrer l&apos;audit</SubmitButton>
            ) : (
              <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground-muted">
                Votre role permet la consultation, pas la modification du contexte audit.
              </p>
            )}
          </form>
        </SectionCard>

        <div className="grid gap-6 content-start">
          {/* Points to verify */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="font-bold text-slate-900">Indicateurs sans preuve ({data.missingEvidence.length})</h2>
            </div>
            {data.missingEvidence.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Tous les indicateurs ont au moins une preuve active.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.missingEvidence.slice(0, 8).map((indicator) => (
                  <Link
                    key={indicator.id}
                    href={`/app/referentiel/${indicator.id}`}
                    className="rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        Ind. {indicator.number}
                      </span>
                      <Badge tone={indicator.riskLevel === "CRITICAL" ? "red" : "amber"}>
                        {riskLabels[indicator.riskLevel]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{indicator.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Export readiness */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-brand" />
              <h2 className="font-bold text-slate-900">Préparation export</h2>
            </div>
            {data.auditExportReadiness.blockers.length > 0 ? (
              <ul className="mb-4 space-y-1.5">
                {data.auditExportReadiness.blockers.map((blocker) => (
                  <li key={blocker} className="flex items-start gap-2 text-sm text-rose-800">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    {blocker}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Dossier préparatoire exportable.
              </div>
            )}
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              href="/app/audit/export"
            >
              <FileArchive className="h-4 w-4" />
              Voir le dossier préparatoire
            </Link>
          </SectionCard>

          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h2 className="font-bold text-slate-900">Lien auditeur lecture seule</h2>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Creez un lien temporaire pour partager le dossier preparatoire sans ouvrir votre compte.
            </p>
            {canCreateShare ? (
              <form action={createAuditorShareLinkAction} className="mt-4">
                <SubmitButton variant="secondary">Creer un lien 14 jours</SubmitButton>
              </form>
            ) : (
              <p className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground-muted">
                Votre role ne permet pas de creer un lien auditeur.
              </p>
            )}
            {shareLinks.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {shareLinks.map((share) => (
                  <div key={share.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{share.title}</p>
                      <p className="text-xs text-slate-500">Expire le {formatFrenchDate(share.expiresAt)}</p>
                    </div>
                    {canCreateShare ? (
                      <form action={revokeAuditorShareLinkAction}>
                        <input type="hidden" name="id" value={share.id} />
                        <SubmitButton variant="secondary" size="sm">Revoquer</SubmitButton>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* Timeline */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h2 className="font-bold text-slate-900">Chronologie</h2>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Dernière revue</dt>
                <dd className="font-medium text-slate-900">
                  {formatFrenchDate(
                    data.progress
                      .map((item) => item.lastReviewedAt)
                      .filter(Boolean)
                      .sort()
                      .at(-1) ?? null,
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Prochaine date</dt>
                <dd className="font-medium text-slate-900">
                  {formatFrenchDate(audit?.scheduledDate ?? data.organization?.nextAuditDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Document le plus récent</dt>
                <dd className="font-medium text-slate-900">{formatFrenchDate(data.documents[0]?.createdAt)}</dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </section>

      <Disclaimer>
        À vérifier selon votre situation et le guide officiel RNQ. QualiPilot ne garantit pas la certification.
      </Disclaimer>
    </main>
  );
}
