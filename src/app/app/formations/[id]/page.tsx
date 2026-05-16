import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { Badge, ButtonLink, PageHeader, ProgressBar, SubmitButton } from "@/components/ui";
import { formatFrenchDate, formatMoney } from "@/domain/formatting";
import { requireUser } from "@/lib/auth/session";
import { evidenceTypeLabels, trainingStatusLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { archiveTrainingProgramAction, deleteTrainingProgramAction } from "@/server/actions/training";

export default async function TrainingProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getWorkspaceData(user.id);
  const item = data.trainingCompleteness.find(({ program }) => program.id === id);
  if (!item) notFound();
  const { program, completeness } = item;
  const linkedEvidence = data.evidences.filter((evidence) => evidence.trainingProgramLinks.some((link) => link.trainingProgramId === id));

  return (
    <main className="grid gap-6">
      <PageHeader
        title={program.title}
        description={`${program.client ? `${program.client.organizationName} - ` : ""}${program.category ?? "Formation"} - ${trainingStatusLabels[program.status]}`}
        action={<ButtonLink href={`/app/formations/${program.id}/edit`}>Modifier</ButtonLink>}
      />
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-xl bg-surface p-5 shadow-card">
          <div className="flex flex-wrap gap-2">
            <Badge>{trainingStatusLabels[program.status]}</Badge>
            <Badge tone={completeness.isComplete ? "green" : "amber"}>{completeness.score} % complété</Badge>
          </div>
          <div className="mt-4"><ProgressBar value={completeness.score} /></div>
          <dl className="mt-6 grid gap-5 text-sm">
            {[
              ["Public visé", program.publicTarget],
              ["Prérequis", program.prerequisites],
              ["Objectifs", program.objectives],
              ["Durée", program.duration],
              ["Délai d'accès", program.accessDelay],
              ["Prix", formatMoney(program.priceCents)],
              ["Modalités", program.modalities],
              ["Méthodes pédagogiques", program.teachingMethods],
              ["Évaluation", program.evaluationMethods],
              ["Handicap/accessibilité", program.accessibilityInfo],
              ["Contact", program.contactInfo],
              ["Indicateurs de résultats", program.resultIndicators],
              ["Notes", program.notes],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-bold text-slate-900">{label}</dt>
                <dd className="mt-1 leading-6 text-slate-700">{value || "Non renseigné"}</dd>
              </div>
            ))}
          </dl>
        </article>
        <aside className="grid gap-6">
          <div className="rounded-xl bg-surface p-5 shadow-card">
            <h2 className="font-bold">Informations manquantes</h2>
            <ul className="mt-3 list-inside list-disc text-sm leading-6 text-slate-700">
              {completeness.missingFields.map((field) => <li key={field}>{field}</li>)}
              {completeness.missingFields.length === 0 ? <li>Rien à signaler.</li> : null}
            </ul>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-card">
            <h2 className="font-bold">Preuves liées</h2>
            <div className="mt-3 grid gap-3">
              {linkedEvidence.map((evidence) => (
                <div key={evidence.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-semibold">{evidence.title}</p>
                  <p className="text-slate-500">{evidenceTypeLabels[evidence.type]} - {formatFrenchDate(evidence.validityDate)}</p>
                </div>
              ))}
              {linkedEvidence.length === 0 ? <p className="text-sm text-slate-600">Aucune preuve liée.</p> : null}
            </div>
          </div>
          <form action={archiveTrainingProgramAction} className="rounded-md border border-rose-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={program.id} />
            <SubmitButton variant="danger"><Archive className="mr-2 h-4 w-4" /> Archiver</SubmitButton>
          </form>
          <form action={deleteTrainingProgramAction} className="rounded-md border border-rose-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={program.id} />
            <p className="mb-3 text-sm leading-6 text-rose-900">
              Suppression definitive : les liens de preuves sont retires et les actions/documents associes restent
              conserves sans formation liee.
            </p>
            <SubmitButton variant="danger"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</SubmitButton>
          </form>
        </aside>
      </section>
      <Link className="text-sm font-semibold text-sky-700" href="/app/formations">Retour aux formations</Link>
    </main>
  );
}
