import { Archive, FolderOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge, Disclaimer, EmptyState, Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { formatFrenchDate } from "@/domain/formatting";
import { requireUser } from "@/lib/auth/session";
import { evidenceStatusLabels, evidenceTypeLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { archiveEvidenceAction, createEvidenceAction } from "@/server/actions/evidence";

function statusTone(status: string): "green" | "amber" | "red" | "slate" {
  if (status === "ACTIVE") return "green";
  if (status === "TO_REVIEW") return "amber";
  if (status === "EXPIRED") return "red";
  return "slate";
}

export default async function EvidencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const clientId = typeof params.clientId === "string" ? params.clientId : null;
  const data = await getWorkspaceData(user.id, { clientId });
  const query = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 20;
  const evidences = data.evidences.filter((evidence) => {
    if (query && !`${evidence.title} ${evidence.description ?? ""}`.toLowerCase().includes(query)) return false;
    if (status && evidence.status !== status) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(evidences.length / pageSize));
  const pageItems = evidences.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Bibliothèque de preuves"
        description="Centralisez vos procédures, programmes, émargements, évaluations, CV et questionnaires."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      {/* Expired banner */}
      {data.expiredEvidence.length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <strong>{data.expiredEvidence.length} preuve(s) expirée(s)</strong> — Vérifiez leur validité avant l&apos;audit.
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Add evidence form */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Ajouter une preuve</h2>
          <form action={createEvidenceAction} encType="multipart/form-data" className="grid gap-4">
            <input type="hidden" name="returnTo" value={clientId ? `/app/preuves?clientId=${clientId}` : "/app/preuves"} />
            <Field label="Titre" required>
              <input className={inputClass} name="title" required placeholder="Ex. : Procédure accueil apprenant" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type">
                <select className={inputClass} name="type" defaultValue="OTHER">
                  {Object.entries(evidenceTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Statut">
                <select className={inputClass} name="status" defaultValue="ACTIVE">
                  {Object.entries(evidenceStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {data.cabinetClients.length > 0 ? (
              <Field label="Client cabinet">
                <select className={inputClass} name="clientId" defaultValue={clientId ?? ""}>
                  <option value="">Aucun client</option>
                  {data.cabinetClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organizationName}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Description">
              <textarea className={textareaClass} name="description" placeholder="Description courte, contexte, contenu..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fichier preuve">
                <input className={inputClass} name="file" type="file" />
              </Field>
              <Field label="URL externe" hint="Drive, SharePoint, URL locale...">
                <input className={inputClass} name="externalUrl" placeholder="https://..." />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date de validité">
                <input className={inputClass} name="validityDate" type="date" />
              </Field>
              <Field label="Responsable">
                <input className={inputClass} name="responsible" placeholder="Nom du responsable" />
              </Field>
            </div>
            <Field label="Indicateurs liés" hint="Ctrl/Cmd + clic pour sélection multiple.">
              <select className={inputClass} name="indicatorIds" multiple size={5}>
                {data.indicatorRows.map((indicator) => (
                  <option key={indicator.id} value={indicator.id}>
                    #{indicator.number} {indicator.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Formations liées" hint="Ctrl/Cmd + clic pour sélection multiple.">
              <select className={inputClass} name="trainingProgramIds" multiple size={3}>
                {data.trainingPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes internes">
              <textarea className={textareaClass} name="notes" placeholder="Notes de gestion, références, remarques..." />
            </Field>
            <SubmitButton>Ajouter la preuve</SubmitButton>
          </form>
        </SectionCard>

        {/* Evidence list */}
        <section className="grid gap-4 content-start">
          {/* Search/filter */}
          <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
            {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
            <input className={inputClass} name="q" placeholder="Rechercher une preuve…" defaultValue={query} />
            <select className={inputClass} name="status" defaultValue={status}>
              <option value="">Tous les statuts</option>
              {Object.entries(evidenceStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
              type="submit"
            >
              Filtrer
            </button>
          </form>

          {evidences.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-10 w-10" />}
              title="Aucune preuve trouvée"
              description="Vous n'avez encore ajouté aucune preuve. Commencez par vos procédures, programmes, feuilles d'émargement ou questionnaires de satisfaction."
            />
          ) : null}

          {pageItems.map((evidence) => (
            <article key={evidence.id} className="rounded-xl bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{evidence.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {evidence.client ? `${evidence.client.organizationName} — ` : ""}
                    {evidenceTypeLabels[evidence.type]}
                    {evidence.validityDate ? ` — validité ${formatFrenchDate(evidence.validityDate)}` : ""}
                  </p>
                </div>
                <Badge tone={statusTone(evidence.status)}>{evidenceStatusLabels[evidence.status]}</Badge>
              </div>
              {evidence.description ? (
                <p className="mt-3 text-sm leading-6 text-slate-700">{evidence.description}</p>
              ) : null}
              {evidence.fileUrl && evidence.fileMimeType?.startsWith("image/") ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface-subtle">
                  <Image
                    src={evidence.fileUrl}
                    alt={`Apercu de ${evidence.title}`}
                    width={900}
                    height={500}
                    unoptimized
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : null}
              {evidence.fileUrl && evidence.fileMimeType === "application/pdf" ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface-subtle">
                  <iframe
                    src={evidence.fileUrl}
                    title={`Apercu PDF de ${evidence.title}`}
                    className="h-72 w-full"
                  />
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {evidence.indicatorLinks.map((link) => (
                  <Badge key={link.id} tone="blue">
                    Ind. {link.indicator.number}
                  </Badge>
                ))}
                {evidence.trainingProgramLinks.map((link) => (
                  <Badge key={link.id}>{link.trainingProgram.title}</Badge>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {evidence.fileUrl ? (
                  <a className="text-sm font-semibold text-brand hover:underline" href={evidence.fileUrl}>
                    {evidence.fileName ?? "Fichier preuve"}
                  </a>
                ) : null}
                {evidence.externalUrl ? (
                  <a
                    className="text-sm font-semibold text-brand hover:underline"
                    href={evidence.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    URL externe ↗
                  </a>
                ) : null}
                <form action={archiveEvidenceAction} className="ml-auto">
                  <input type="hidden" name="id" value={evidence.id} />
                  {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-700"
                    type="submit"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archiver
                  </button>
                </form>
              </div>
            </article>
          ))}
          {totalPages > 1 ? (
            <nav className="flex items-center justify-between rounded-xl bg-surface p-4 text-sm shadow-card">
              <Link className="font-semibold text-brand hover:underline" href={`/app/preuves?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&page=${Math.max(1, page - 1)}${clientId ? `&clientId=${encodeURIComponent(clientId)}` : ""}`}>
                Page precedente
              </Link>
              <span className="text-foreground-muted">Page {page} / {totalPages}</span>
              <Link className="font-semibold text-brand hover:underline" href={`/app/preuves?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&page=${Math.min(totalPages, page + 1)}${clientId ? `&clientId=${encodeURIComponent(clientId)}` : ""}`}>
                Page suivante
              </Link>
            </nav>
          ) : null}
        </section>
      </section>

      <Disclaimer>
        À vérifier selon votre situation et le guide officiel RNQ. QualiPilot ne garantit pas la certification.
      </Disclaimer>
    </main>
  );
}
