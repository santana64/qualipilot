import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import { Badge, EmptyState, Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { formatFrenchDate } from "@/domain/formatting";
import { requireUser } from "@/lib/auth/session";
import { actionPriorityLabels, actionStatusLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { cancelActionPlanItemAction, createActionPlanItemAction, markActionDoneAction } from "@/server/actions/action-plan";

function priorityTone(priority: string): "red" | "amber" | "slate" {
  if (priority === "CRITICAL") return "red";
  if (priority === "HIGH") return "amber";
  return "slate";
}

function statusTone(status: string): "green" | "amber" | "slate" {
  if (status === "DONE") return "green";
  if (status === "IN_PROGRESS") return "amber";
  return "slate";
}

export default async function ActionPlanPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const clientId = typeof params.clientId === "string" ? params.clientId : null;
  const data = await getWorkspaceData(user.id, { clientId });
  const priority = typeof params.priority === "string" ? params.priority : "";
  const overdue = params.overdue === "1";
  const overdueIds = new Set(data.overdueActions.map((action) => action.id));
  const actions = data.actions.filter((action) => {
    if (priority && action.priority !== priority) return false;
    if (overdue && !overdueIds.has(action.id)) return false;
    return true;
  });

  const overdueCount = data.overdueActions.length;
  const doneCount = data.actions.filter((a) => a.status === "DONE").length;
  const openCount = data.actions.filter((a) => a.status !== "DONE" && a.status !== "CANCELLED").length;

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Plan d&apos;actions"
        description="Suivez vos actions d'amélioration continue, reliées aux indicateurs RNQ et aux preuves associées."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      {/* Summary row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">En retard</p>
          <p className="mt-1 text-3xl font-bold text-rose-900">{overdueCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">En cours</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{openCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Terminées</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">{doneCount}</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        {/* Create form */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Créer une action</h2>
          <form action={createActionPlanItemAction} className="grid gap-4">
            <input type="hidden" name="returnTo" value={clientId ? `/app/actions?clientId=${clientId}` : "/app/actions"} />
            {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
            <Field label="Titre" required>
              <input className={inputClass} name="title" required placeholder="Ex. : Mettre à jour la procédure handicap" />
            </Field>
            <Field label="Description">
              <textarea className={textareaClass} name="description" placeholder="Détail de l'action, contexte..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Priorité">
                <select className={inputClass} name="priority" defaultValue="MEDIUM">
                  {Object.entries(actionPriorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Statut">
                <select className={inputClass} name="status" defaultValue="TODO">
                  {Object.entries(actionStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Échéance">
                <input className={inputClass} name="dueDate" type="date" />
              </Field>
              <Field label="Responsable">
                <input className={inputClass} name="responsible" placeholder="Nom du responsable" />
              </Field>
            </div>
            {data.cabinetClients.length > 0 ? (
              <Field label="Client cabinet">
                <select className={inputClass} name="clientId" defaultValue="">
                  <option value="">Aucun client</option>
                  {data.cabinetClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organizationName}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Indicateur lié">
              <select className={inputClass} name="indicatorId" defaultValue="">
                <option value="">Aucun</option>
                {data.indicatorRows.map((indicator) => (
                  <option key={indicator.id} value={indicator.id}>
                    #{indicator.number} {indicator.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preuve liée">
              <select className={inputClass} name="evidenceId" defaultValue="">
                <option value="">Aucune</option>
                {data.evidences.map((evidence) => (
                  <option key={evidence.id} value={evidence.id}>
                    {evidence.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Formation liée">
              <select className={inputClass} name="trainingProgramId" defaultValue="">
                <option value="">Aucune</option>
                {data.trainingPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </Field>
            <SubmitButton>Créer l&apos;action</SubmitButton>
          </form>
        </SectionCard>

        {/* Action list */}
        <section className="grid gap-4 content-start">
          {/* Filter */}
          <form className="grid gap-3 rounded-xl bg-surface p-4 shadow-card md:grid-cols-3">
            {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
            <select className={inputClass} name="priority" defaultValue={priority}>
              <option value="">Toutes priorités</option>
              {Object.entries(actionPriorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium">
              <input type="checkbox" name="overdue" value="1" defaultChecked={overdue} className="rounded" />
              En retard uniquement
            </label>
            <button
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
              type="submit"
            >
              Filtrer
            </button>
          </form>

          {actions.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-10 w-10" />}
              title="Aucune action"
              description="Créez vos actions d'amélioration continue et reliez-les aux indicateurs concernés."
            />
          ) : null}

          {actions.map((action) => {
            const isOverdue = overdueIds.has(action.id);
            return (
              <article
                key={action.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${
                  isOverdue ? "border-rose-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                          En retard
                        </span>
                      ) : null}
                      <h2 className="font-bold text-slate-900">{action.title}</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {action.client ? `${action.client.organizationName} — ` : ""}
                      Échéance : {formatFrenchDate(action.dueDate)}
                      {action.responsible ? ` — ${action.responsible}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={priorityTone(action.priority)}>{actionPriorityLabels[action.priority]}</Badge>
                    <Badge tone={statusTone(action.status)}>{actionStatusLabels[action.status]}</Badge>
                  </div>
                </div>
                {action.description ? (
                  <p className="mt-3 text-sm leading-6 text-slate-700">{action.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {action.indicator ? (
                    <Badge tone="blue">Ind. {action.indicator.number}</Badge>
                  ) : null}
                  {action.evidence ? <Badge>{action.evidence.title}</Badge> : null}
                  {action.trainingProgram ? <Badge>{action.trainingProgram.title}</Badge> : null}
                </div>
                {action.status !== "DONE" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={markActionDoneAction} className="flex gap-2">
                      <input type="hidden" name="id" value={action.id} />
                      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
                      <input
                        className={inputClass + " max-w-[200px]"}
                        name="completionNote"
                        placeholder="Note de clôture"
                      />
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                        type="submit"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Terminer
                      </button>
                    </form>
                    <form action={cancelActionPlanItemAction}>
                      <input type="hidden" name="id" value={action.id} />
                      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                        type="submit"
                      >
                        <XCircle className="h-4 w-4" />
                        Annuler
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
