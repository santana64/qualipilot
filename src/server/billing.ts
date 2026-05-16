import type { Plan } from "@/domain/billing/plans";
import {
  canCreateEvidence,
  canCreateTrainingProgram,
  canExportAuditFile,
  canGenerateDocument,
  canUseCabinetMode,
  getPlanLimits,
} from "@/domain/billing/plans";
import { BillingError } from "@/lib/errors";
import { prisma } from "@/lib/db";

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return (subscription?.plan ?? "FREE") as Plan;
}

export async function assertCanCreateTrainingProgram(userId: string) {
  const [plan, count] = await Promise.all([
    getUserPlan(userId),
    prisma.trainingProgram.count({ where: { userId, status: { not: "ARCHIVED" } } }),
  ]);
  if (!canCreateTrainingProgram(plan, count)) throw new BillingError();
}

export async function assertCanCreateEvidence(userId: string) {
  const [plan, count] = await Promise.all([
    getUserPlan(userId),
    prisma.evidence.count({ where: { userId, status: { not: "ARCHIVED" } } }),
  ]);
  if (!canCreateEvidence(plan, count)) throw new BillingError();
}

export async function assertCanGenerateDocument(userId: string) {
  const plan = await getUserPlan(userId);
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const count = await prisma.generatedDocument.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });
  if (!canGenerateDocument(plan, count)) throw new BillingError();
}

export async function assertCanExportAuditFile(userId: string) {
  const plan = await getUserPlan(userId);
  if (!canExportAuditFile(plan)) throw new BillingError();
}

export async function assertCanUseCabinetMode(userId: string) {
  const plan = await getUserPlan(userId);
  if (!canUseCabinetMode(plan)) throw new BillingError();
}

export async function getUsage(userId: string) {
  const plan = await getUserPlan(userId);
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const [trainingPrograms, evidences, generatedDocuments] = await Promise.all([
    prisma.trainingProgram.count({ where: { userId, status: { not: "ARCHIVED" } } }),
    prisma.evidence.count({ where: { userId, status: { not: "ARCHIVED" } } }),
    prisma.generatedDocument.count({ where: { userId, createdAt: { gte: since } } }),
  ]);
  const limits = getPlanLimits(plan);
  const overages = {
    trainingPrograms:
      limits.trainingPrograms !== "unlimited" && trainingPrograms > limits.trainingPrograms
        ? trainingPrograms - limits.trainingPrograms
        : 0,
    evidences: limits.evidences !== "unlimited" && evidences > limits.evidences ? evidences - limits.evidences : 0,
    generatedDocuments:
      limits.generatedDocumentsPerMonth !== "unlimited" && generatedDocuments > limits.generatedDocumentsPerMonth
        ? generatedDocuments - limits.generatedDocumentsPerMonth
        : 0,
  };
  return {
    plan,
    limits,
    trainingPrograms,
    evidences,
    generatedDocuments,
    overages,
    isOverLimit: Object.values(overages).some((count) => count > 0),
  };
}

export async function flagSubscriptionOverLimit(userId: string) {
  const usage = await getUsage(userId);
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription) return usage;

  const baseStatus = subscription.status.replace(/_over_limit$/, "");
  const nextStatus = usage.isOverLimit ? `${baseStatus}_over_limit` : baseStatus;
  if (nextStatus !== subscription.status) {
    await prisma.subscription.update({
      where: { userId },
      data: { status: nextStatus },
    });
  }
  return usage;
}
