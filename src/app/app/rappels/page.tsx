import { Bell, Send, XCircle } from "lucide-react";
import { Badge, Field, Notice, PageHeader, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { formatFrenchDate } from "@/domain/formatting";
import { reminderStatusLabels, reminderTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/db";
import { cancelReminderAction, createReminderAction, sendDueRemindersNowAction } from "@/server/actions/reminders";
import { requireWorkspacePermission } from "@/server/rbac";

function statusTone(status: string) {
  if (status === "SENT") return "green";
  if (status === "FAILED") return "red";
  if (status === "ACTIVE") return "blue";
  return "slate";
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await requireWorkspacePermission("manageReminders");
  const params = (await searchParams) ?? {};
  const [reminders, clients] = await Promise.all([
    prisma.emailReminder.findMany({
      where: { userId: workspace.workspaceUserId },
      orderBy: [{ status: "asc" }, { scheduledFor: "asc" }],
      include: { client: true },
    }),
    prisma.cabinetClient.findMany({ where: { userId: workspace.workspaceUserId, status: "ACTIVE" }, orderBy: { organizationName: "asc" } }),
  ]);

  return (
    <main className="grid gap-6">
      <PageHeader
        title="Rappels email"
        description="Les rappels sont créés automatiquement pour les échéances d'actions, audits et preuves, et peuvent aussi être planifiés manuellement."
        action={
          <form action={sendDueRemindersNowAction}>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">
              <Send className="h-4 w-4" /> Envoyer les rappels échus
            </button>
          </form>
        }
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <form action={createReminderAction} className="grid gap-4 rounded-xl bg-surface p-5 shadow-card">
          <h2 className="font-bold">Planifier un rappel</h2>
          <Field label="Type">
            <select className={inputClass} name="type" defaultValue="ACTION_DUE">
              {Object.entries(reminderTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          {clients.length > 0 ? (
            <Field label="Client cabinet">
              <select className={inputClass} name="clientId" defaultValue="">
                <option value="">Aucun client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.organizationName}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="Sujet">
            <input className={inputClass} name="subject" required />
          </Field>
          <Field label="Message">
            <textarea className={textareaClass} name="message" required />
          </Field>
          <Field label="Date d'envoi">
            <input className={inputClass} name="scheduledFor" type="datetime-local" required />
          </Field>
          <SubmitButton>Planifier</SubmitButton>
        </form>

        <section className="grid gap-4">
          {reminders.map((reminder) => (
            <article key={reminder.id} className="rounded-xl bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-sky-700" />
                    <h2 className="font-bold">{reminder.subject}</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {reminder.client ? `${reminder.client.organizationName} - ` : ""}
                    {reminderTypeLabels[reminder.type]} - prévu le {formatFrenchDate(reminder.scheduledFor)}
                  </p>
                </div>
                <Badge tone={statusTone(reminder.status)}>{reminderStatusLabels[reminder.status]}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{reminder.message}</p>
              {reminder.lastError ? <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{reminder.lastError}</p> : null}
              {reminder.status === "ACTIVE" ? (
                <form action={cancelReminderAction} className="mt-4">
                  <input type="hidden" name="id" value={reminder.id} />
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" type="submit">
                    <XCircle className="h-4 w-4" /> Annuler
                  </button>
                </form>
              ) : null}
            </article>
          ))}
          {reminders.length === 0 ? <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">Aucun rappel planifié.</p> : null}
        </section>
      </section>
    </main>
  );
}
