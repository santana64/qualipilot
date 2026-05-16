import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { Badge, EmptyState, Notice, PageHeader, SectionCard, SubmitButton, inputClass } from "@/components/ui";
import { formatFrenchDate } from "@/domain/formatting";
import { requireUser } from "@/lib/auth/session";
import { documentTypeLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { deleteDocumentAction, generateDocumentAction } from "@/server/actions/documents";

const templates = [
  "LEARNER_WELCOME_PROCEDURE",
  "ACCESSIBILITY_PROCEDURE",
  "EVALUATION_PROCEDURE",
  "TRAINING_PROGRAM_TEMPLATE",
  "SATISFACTION_QUESTIONNAIRE",
  "ATTENDANCE_SHEET_TEMPLATE",
  "CONTINUOUS_IMPROVEMENT_PLAN",
  "COMPLAINT_MANAGEMENT_PROCEDURE",
  "AUDIT_SUMMARY",
  "FULL_AUDIT_FILE",
] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const data = await getWorkspaceData(user.id);
  return (
    <main className="grid gap-8">
      <PageHeader
        title="Documents qualité"
        description="Générez des documents qualité réels à partir du profil organisme, des formations et des preuves."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      {/* Generate templates */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Générer un document</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((type) => (
            <form
              key={type}
              action={generateDocumentAction}
              className="rounded-xl bg-surface p-5 shadow-card"
            >
              <input type="hidden" name="type" value={type} />
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                  <FileText className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{documentTypeLabels[type]}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Sauvegardé, prévisualisable et imprimable.
                  </p>
                </div>
              </div>
              {data.cabinetClients.length > 0 ? (
                <select className={`${inputClass} mt-4`} name="clientId" defaultValue="">
                  <option value="">Aucun client cabinet</option>
                  {data.cabinetClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organizationName}
                    </option>
                  ))}
                </select>
              ) : null}
              {type === "TRAINING_PROGRAM_TEMPLATE" ? (
                <select className={`${inputClass} mt-4`} name="relatedTrainingProgramId" defaultValue="">
                  <option value="">Première formation disponible</option>
                  {data.trainingPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="mt-4">
                <SubmitButton variant={type === "FULL_AUDIT_FILE" ? "primary" : "secondary"} size="sm">
                  Générer
                </SubmitButton>
              </div>
            </form>
          ))}
        </div>
      </section>

      {/* Saved documents */}
      <SectionCard className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Documents sauvegardés ({data.documents.length})</h2>
        </div>
        {data.documents.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Aucun document généré"
              description="Générez vos premiers documents qualité depuis les templates ci-dessus."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <Link
                  href={`/app/documents/${document.id}`}
                  className="group font-semibold text-slate-900 hover:text-brand"
                >
                  {document.title}
                  <span className="mt-0.5 block text-sm font-normal text-slate-500">
                    {documentTypeLabels[document.type]} — {formatFrenchDate(document.createdAt)}
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  {document.relatedIndicator ? (
                    <Badge tone="blue">Ind. {document.relatedIndicator.number}</Badge>
                  ) : null}
                  {document.relatedTrainingProgram ? (
                    <Badge>{document.relatedTrainingProgram.title}</Badge>
                  ) : null}
                  {document.client ? (
                    <Badge tone="blue">{document.client.organizationName}</Badge>
                  ) : null}
                  <form action={deleteDocumentAction}>
                    <input type="hidden" name="id" value={document.id} />
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-700"
                      type="submit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </main>
  );
}
