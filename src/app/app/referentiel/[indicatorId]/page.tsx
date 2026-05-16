import { notFound } from "next/navigation";
import { Badge, Disclaimer, Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { createActionPlanItemAction } from "@/server/actions/action-plan";
import { createEvidenceAction, linkEvidenceToIndicatorAction } from "@/server/actions/evidence";
import { updateIndicatorProgressAction } from "@/server/actions/rnq";
import { evidenceTypeLabels, indicatorStatusLabels, riskLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { formatFrenchDate } from "@/domain/formatting";
import { getWorkspaceContext } from "@/server/rbac";

function riskTone(level: string): "red" | "amber" | "slate" {
  if (level === "CRITICAL") return "red";
  if (level === "HIGH") return "amber";
  return "slate";
}

function statusTone(status: string): "green" | "amber" | "slate" | "violet" {
  if (status === "READY" || status === "VALIDATED") return "green";
  if (status === "NEEDS_REVIEW" || status === "IN_PROGRESS") return "amber";
  if (status === "NOT_APPLICABLE") return "violet";
  return "slate";
}

export default async function IndicatorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ indicatorId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await getWorkspaceContext();
  const { indicatorId } = await params;
  const messages = (await searchParams) ?? {};
  const clientId = typeof messages.clientId === "string" ? messages.clientId : null;
  const clientQuery = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  const data = await getWorkspaceData(workspace.workspaceUserId, { clientId });
  const criterion = data.criteria.find((item) => item.indicators.some((indicator) => indicator.id === indicatorId));
  const indicator = criterion?.indicators.find((item) => item.id === indicatorId);
  const row = data.indicatorRows.find((item) => item.id === indicatorId);
  const progress = data.progress.find((item) => item.indicatorId === indicatorId);
  if (!indicator || !criterion || !row) notFound();

  const linkedEvidence = data.evidences.filter((evidence) =>
    evidence.indicatorLinks.some((link) => link.indicatorId === indicatorId),
  );
  const linkedActions = data.actions.filter((action) => action.indicatorId === indicatorId);
  const linkedDocs = data.documents.filter((document) => document.relatedIndicatorId === indicatorId);

  return (
    <main className="grid gap-8">
      <PageHeader
        title={`Indicateur ${indicator.number}`}
        description={indicator.shortDescription}
      />
      <Notice message={messages.error} type="error" />
      <Notice message={messages.success} type="success" />

      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">Critère {criterion.number} — {criterion.title}</Badge>
        <Badge tone={riskTone(indicator.riskLevel)}>Risque : {riskLabels[indicator.riskLevel]}</Badge>
        <Badge tone={statusTone(row.status)}>{indicatorStatusLabels[row.status]}</Badge>
      </div>

      {/* ── Main 2-col ── */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: indicator details */}
        <div className="grid gap-6 content-start">
          <SectionCard>
            <h2 className="font-bold text-slate-900">Intitulé complet</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">{indicator.title}</p>

            <h2 className="mt-6 font-bold text-slate-900">Niveau attendu</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">{indicator.expectedLevel}</p>

            <h2 className="mt-6 font-bold text-slate-900">Exemples d&apos;éléments de preuve</h2>
            <ul className="mt-2 space-y-1.5">
              {indicator.evidenceExamples.map((example) => (
                <li key={example} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {example}
                </li>
              ))}
            </ul>

            <h2 className="mt-6 font-bold text-slate-900">Applicabilité</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {indicator.applicableTo.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </SectionCard>

          {/* Linked evidence */}
          <SectionCard>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Preuves associées ({linkedEvidence.length})</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {linkedEvidence.map((evidence) => (
                <div key={evidence.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{evidence.title}</p>
                  <p className="mt-1 text-slate-500">
                    {evidenceTypeLabels[evidence.type]}
                    {evidence.validityDate ? ` — validité ${formatFrenchDate(evidence.validityDate)}` : ""}
                  </p>
                </div>
              ))}
              {linkedEvidence.length === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Aucune preuve associée à cet indicateur.
                </p>
              ) : null}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Associer une preuve existante</h3>
              <form action={linkEvidenceToIndicatorAction} className="flex gap-2">
                <input type="hidden" name="indicatorId" value={indicator.id} />
                {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
                <select className={inputClass} name="evidenceId" required>
                  {data.evidences.map((evidence) => (
                    <option key={evidence.id} value={evidence.id}>
                      {evidence.title}
                    </option>
                  ))}
                </select>
                <SubmitButton variant="secondary">Associer</SubmitButton>
              </form>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Créer une nouvelle preuve</h3>
              <form action={createEvidenceAction} className="grid gap-3">
                <input type="hidden" name="returnTo" value={`/app/referentiel/${indicator.id}${clientQuery}`} />
                {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
                <input type="hidden" name="indicatorIds" value={indicator.id} />
                <input className={inputClass} name="title" placeholder="Titre de la preuve" required />
                <select className={inputClass} name="type" defaultValue="OTHER">
                  {Object.entries(evidenceTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input className={inputClass} name="externalUrl" placeholder="URL documentaire ou chemin local" />
                <SubmitButton>Créer et associer</SubmitButton>
              </form>
            </div>
          </SectionCard>
        </div>

        {/* Right: status + actions + docs */}
        <div className="grid gap-6 content-start">
          {/* Status update */}
          <SectionCard>
            <h2 className="mb-4 font-bold text-slate-900">Statut de préparation</h2>
            <form action={updateIndicatorProgressAction} className="grid gap-4">
              <input type="hidden" name="indicatorId" value={indicator.id} />
              {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
              <Field label="Statut actuel">
                <select className={inputClass} name="status" defaultValue={progress?.status ?? "NOT_STARTED"}>
                  {Object.entries(indicatorStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes qualité">
                <textarea
                  className={textareaClass}
                  name="notes"
                  defaultValue={progress?.notes ?? ""}
                  placeholder="Observations, points à vérifier, contacts..."
                />
              </Field>
              {progress?.lastReviewedAt ? (
                <p className="text-xs text-slate-500">
                  Dernière mise à jour : {formatFrenchDate(progress.lastReviewedAt)}
                </p>
              ) : null}
              <SubmitButton>Enregistrer le statut</SubmitButton>
            </form>
          </SectionCard>

          {/* Actions */}
          <SectionCard>
            <h2 className="mb-4 font-bold text-slate-900">Actions liées ({linkedActions.length})</h2>
            <div className="grid gap-2">
              {linkedActions.map((action) => (
                <div key={action.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <p className="mt-1 text-slate-500">Échéance : {formatFrenchDate(action.dueDate)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Créer une action</h3>
              <form action={createActionPlanItemAction} className="grid gap-3">
                <input type="hidden" name="returnTo" value={`/app/referentiel/${indicator.id}${clientQuery}`} />
                {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
                <input type="hidden" name="indicatorId" value={indicator.id} />
                <input className={inputClass} name="title" placeholder="Action à créer" required />
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputClass} name="priority" defaultValue={indicator.riskLevel}>
                    <option value="LOW">Faible</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                  <input className={inputClass} type="date" name="dueDate" />
                </div>
                <SubmitButton size="sm">Ajouter l&apos;action</SubmitButton>
              </form>
            </div>
          </SectionCard>

          {/* Generated docs */}
          {linkedDocs.length > 0 ? (
            <SectionCard>
              <h2 className="mb-4 font-bold text-slate-900">Documents générés ({linkedDocs.length})</h2>
              <div className="grid gap-2">
                {linkedDocs.map((document) => (
                  <a
                    key={document.id}
                    href={`/app/documents/${document.id}`}
                    className="rounded-lg border border-border p-3 text-sm font-semibold text-brand hover:bg-brand-subtle"
                  >
                    {document.title}
                  </a>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      </section>

      <Disclaimer>
        À vérifier selon votre situation et le guide officiel RNQ. QualiPilot ne garantit pas la certification.
      </Disclaimer>
    </main>
  );
}
