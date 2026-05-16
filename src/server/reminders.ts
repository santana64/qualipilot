import { addDays } from "date-fns";
import { formatFrenchDate } from "@/domain/formatting";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { createReminderUnsubscribeUrl } from "@/lib/unsubscribe";

function scheduleBefore(date: Date, daysBefore: number) {
  const scheduled = addDays(date, -daysBefore);
  return scheduled < new Date() ? new Date(Date.now() + 60 * 1000) : scheduled;
}

export async function scheduleActionReminder(input: {
  userId: string;
  clientId?: string | null;
  actionPlanItemId: string;
  title: string;
  dueDate: Date | null;
}) {
  if (!input.dueDate) return;
  await prisma.emailReminder.create({
    data: {
      userId: input.userId,
      clientId: input.clientId ?? null,
      actionPlanItemId: input.actionPlanItemId,
      type: "ACTION_DUE",
      subject: `Action qualite a traiter : ${input.title}`,
      message: `L'action "${input.title}" arrive a echeance le ${formatFrenchDate(input.dueDate)}.`,
      scheduledFor: scheduleBefore(input.dueDate, 3),
    },
  });
}

export async function scheduleEvidenceExpiryReminder(input: {
  userId: string;
  clientId?: string | null;
  evidenceId: string;
  title: string;
  validityDate: Date | null;
}) {
  if (!input.validityDate) return;
  await prisma.emailReminder.create({
    data: {
      userId: input.userId,
      clientId: input.clientId ?? null,
      evidenceId: input.evidenceId,
      type: "EVIDENCE_EXPIRY",
      subject: `Preuve a verifier : ${input.title}`,
      message: `La preuve "${input.title}" arrive a echeance le ${formatFrenchDate(input.validityDate)}.`,
      scheduledFor: scheduleBefore(input.validityDate, 14),
    },
  });
}

export async function scheduleAuditReminder(input: {
  userId: string;
  clientId?: string | null;
  auditRecordId: string;
  scheduledDate: Date;
  type: string;
}) {
  await prisma.emailReminder.create({
    data: {
      userId: input.userId,
      clientId: input.clientId ?? null,
      auditRecordId: input.auditRecordId,
      type: "AUDIT_PREPARATION",
      subject: `Audit ${input.type.toLowerCase()} a preparer`,
      message: `Votre audit ${input.type.toLowerCase()} est prevu le ${formatFrenchDate(input.scheduledDate)}. Verifiez le dossier preparatoire, les preuves critiques et les actions en retard.`,
      scheduledFor: scheduleBefore(input.scheduledDate, 30),
    },
  });
}

export async function ensureAutomaticReminders(userId: string) {
  const [actions, evidences, audits] = await Promise.all([
    prisma.actionPlanItem.findMany({
      where: {
        userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { not: null },
        reminders: { none: { status: { in: ["ACTIVE", "PAUSED", "SENT"] } } },
      },
      select: {
        id: true,
        clientId: true,
        title: true,
        dueDate: true,
      },
      take: 100,
    }),
    prisma.evidence.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "TO_REVIEW"] },
        validityDate: { not: null },
        reminders: { none: { status: { in: ["ACTIVE", "PAUSED", "SENT"] } } },
      },
      select: {
        id: true,
        clientId: true,
        title: true,
        validityDate: true,
      },
      take: 100,
    }),
    prisma.auditRecord.findMany({
      where: {
        userId,
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        reminders: { none: { status: { in: ["ACTIVE", "PAUSED", "SENT"] } } },
      },
      select: {
        id: true,
        clientId: true,
        scheduledDate: true,
        type: true,
      },
      take: 50,
    }),
  ]);

  for (const action of actions) {
    await scheduleActionReminder({
      userId,
      clientId: action.clientId,
      actionPlanItemId: action.id,
      title: action.title,
      dueDate: action.dueDate,
    });
  }

  for (const evidence of evidences) {
    await scheduleEvidenceExpiryReminder({
      userId,
      clientId: evidence.clientId,
      evidenceId: evidence.id,
      title: evidence.title,
      validityDate: evidence.validityDate,
    });
  }

  for (const audit of audits) {
    await scheduleAuditReminder({
      userId,
      clientId: audit.clientId,
      auditRecordId: audit.id,
      scheduledDate: audit.scheduledDate,
      type: audit.type,
    });
  }

  return {
    actions: actions.length,
    evidences: evidences.length,
    audits: audits.length,
  };
}

export async function sendDueReminders(now = new Date()) {
  const reminders = await prisma.emailReminder.findMany({
    where: {
      status: "ACTIVE",
      scheduledFor: { lte: now },
    },
    take: 50,
    orderBy: { scheduledFor: "asc" },
    include: {
      user: { select: { email: true, name: true, reminderEmailsUnsubscribedAt: true } },
      client: { select: { organizationName: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    try {
      if (reminder.user.reminderEmailsUnsubscribedAt) {
        await prisma.emailReminder.update({
          where: { id: reminder.id },
          data: { status: "CANCELLED", lastError: "Utilisateur desinscrit des rappels email." },
        });
        continue;
      }
      const unsubscribeUrl = createReminderUnsubscribeUrl(reminder.userId);
      await sendReminderEmail({
        to: reminder.user.email,
        name: reminder.user.name ?? reminder.user.email,
        subject: reminder.subject,
        message: reminder.message,
        clientName: reminder.client?.organizationName,
        type: reminder.type as "ACTION_DUE" | "EVIDENCE_EXPIRY" | "AUDIT_PREPARATION",
        unsubscribeUrl,
      });
      await prisma.emailReminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null },
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      await prisma.emailReminder.update({
        where: { id: reminder.id },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Erreur inconnue",
        },
      });
    }
  }

  return { scanned: reminders.length, sent, failed };
}
