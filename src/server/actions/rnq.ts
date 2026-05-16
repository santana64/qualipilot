"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { statusToScore } from "@/domain/rnq/readiness";
import type { IndicatorStatus } from "@/domain/rnq/types";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { assertValidClientForUser } from "@/server/cabinet";
import { ensureUserIndicatorProgress } from "@/server/referential";
import { requireWorkspacePermission } from "@/server/rbac";

const progressSchema = z.object({
  indicatorId: z.string().min(1),
  clientId: z.string().trim().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "NEEDS_REVIEW", "READY", "VALIDATED", "NOT_APPLICABLE"]),
  notes: z.string().trim().optional(),
});

export async function updateIndicatorProgressAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageRnq");
  const indicatorId = String(formData.get("indicatorId") ?? "");
  const clientId = String(formData.get("clientId") ?? "") || null;
  const clientQuery = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  let target = indicatorId
    ? `/app/referentiel/${indicatorId}${clientQuery}${clientQuery ? "&" : "?"}success=Indicateur%20mis%20%C3%A0%20jour.`
    : `/app/referentiel${clientQuery}`;
  try {
    const parsed = progressSchema.parse(Object.fromEntries(formData));
    const client = await assertValidClientForUser(workspace.workspaceUserId, parsed.clientId || null);
    await ensureUserIndicatorProgress(workspace.workspaceUserId, client?.id ?? null);
    const score = statusToScore(parsed.status as IndicatorStatus);
    const existing = await prisma.indicatorProgress.findFirst({
      where: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        indicatorId: parsed.indicatorId,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.indicatorProgress.update({
        where: { id: existing.id },
        data: {
          status: parsed.status,
          readinessScore: score ?? 0,
          notes: parsed.notes || null,
          lastReviewedAt: new Date(),
        },
      });
    } else {
      await prisma.indicatorProgress.create({
        data: {
          userId: workspace.workspaceUserId,
          clientId: client?.id ?? null,
          indicatorId: parsed.indicatorId,
          status: parsed.status,
          readinessScore: score ?? 0,
          notes: parsed.notes || null,
          lastReviewedAt: new Date(),
        },
      });
    }
    revalidatePath("/app");
    revalidatePath("/app/referentiel");
  } catch (error) {
    target = indicatorId
      ? `/app/referentiel/${indicatorId}${clientQuery}${clientQuery ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`
      : `/app/referentiel${clientQuery}${clientQuery ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
