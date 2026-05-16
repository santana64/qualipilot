import Link from "next/link";
import { Archive } from "lucide-react";
import { Badge, Field, Notice, PageHeader, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { canUseCabinetMode } from "@/domain/billing/plans";
import { cabinetClientStatusLabels } from "@/lib/labels";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/server/billing";
import { archiveCabinetClientAction, createCabinetClientAction } from "@/server/actions/cabinet";
import { requireWorkspacePermission } from "@/server/rbac";

export default async function CabinetPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await requireWorkspacePermission("manageCabinet");
  const params = (await searchParams) ?? {};
  const plan = await getUserPlan(workspace.workspaceUserId);
  const enabled = canUseCabinetMode(plan);
  const clients = await prisma.cabinetClient.findMany({
    where: { userId: workspace.workspaceUserId },
    orderBy: [{ status: "asc" }, { organizationName: "asc" }],
    include: {
      _count: {
        select: {
          trainingPrograms: true,
          evidences: true,
          actionPlanItems: true,
          auditRecords: true,
        },
      },
    },
  });

  if (!enabled) {
    return (
      <main className="grid gap-6">
        <PageHeader title="Mode Cabinet" description="Le portefeuille clients est disponible dans l'offre Cabinet." />
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Votre offre actuelle ne permet pas le mode Cabinet. Passez sur l'offre Cabinet pour gérer plusieurs organismes clients avec leurs formations, preuves, actions et audits rattachés.
        </div>
        <Link className="font-semibold text-sky-700" href="/app/billing">Voir l'offre Cabinet</Link>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <PageHeader title="Cabinet clients" description="Gérez un portefeuille d'organismes clients et rattachez leurs preuves, formations, actions, audits et documents." />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form action={createCabinetClientAction} className="grid gap-4 rounded-xl bg-surface p-5 shadow-card">
          <h2 className="font-bold">Ajouter un client</h2>
          <Field label="Organisme client">
            <input className={inputClass} name="organizationName" required />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact">
              <input className={inputClass} name="contactName" />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Téléphone">
              <input className={inputClass} name="phone" />
            </Field>
            <Field label="SIRET">
              <input className={inputClass} name="siret" />
            </Field>
          </div>
          <Field label="NDA">
            <input className={inputClass} name="ndaNumber" />
          </Field>
          <Field label="Adresse">
            <textarea className={textareaClass} name="address" />
          </Field>
          <Field label="Notes">
            <textarea className={textareaClass} name="notes" />
          </Field>
          <SubmitButton>Créer le client</SubmitButton>
        </form>

        <section className="grid gap-4">
          {clients.map((client) => (
            <article key={client.id} className="rounded-xl bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{client.organizationName}</h2>
                  <p className="mt-1 text-sm text-slate-600">{client.contactName ?? "Contact non renseigné"} - {client.email ?? "email non renseigné"}</p>
                </div>
                <Badge tone={client.status === "ACTIVE" ? "green" : "slate"}>{cabinetClientStatusLabels[client.status]}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
                <div className="rounded-md bg-slate-50 p-3">Formations : {client._count.trainingPrograms}</div>
                <div className="rounded-md bg-slate-50 p-3">Preuves : {client._count.evidences}</div>
                <div className="rounded-md bg-slate-50 p-3">Actions : {client._count.actionPlanItems}</div>
                <div className="rounded-md bg-slate-50 p-3">Audits : {client._count.auditRecords}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{client.notes ?? "Aucune note."}</p>
              {client.status === "ACTIVE" ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground" href={`/app/cabinet/${client.id}`}>
                    Ouvrir la vue client
                  </Link>
                  <form action={archiveCabinetClientAction}>
                    <input type="hidden" name="id" value={client.id} />
                    <button className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" type="submit">
                      <Archive className="h-4 w-4" /> Archiver
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
