"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { assertCanUseCabinetMode } from "@/server/billing";
import { requireWorkspacePermission } from "@/server/rbac";

const clientSchema = z.object({
  organizationName: z.string().trim().min(2),
  contactName: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  ndaNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createCabinetClientAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageCabinet");
  let target = "/app/cabinet?success=Client%20cr%C3%A9%C3%A9.";
  try {
    await assertCanUseCabinetMode(workspace.workspaceUserId);
    const parsed = clientSchema.parse(Object.fromEntries(formData));
    await prisma.cabinetClient.create({
      data: {
        userId: workspace.workspaceUserId,
        organizationName: parsed.organizationName,
        contactName: parsed.contactName || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        siret: parsed.siret || null,
        ndaNumber: parsed.ndaNumber || null,
        address: parsed.address || null,
        notes: parsed.notes || null,
      },
    });
    revalidatePath("/app/cabinet");
  } catch (error) {
    target = `/app/cabinet?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function archiveCabinetClientAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageCabinet");
  let target = "/app/cabinet?success=Client%20archiv%C3%A9.";
  try {
    await assertCanUseCabinetMode(workspace.workspaceUserId);
    const id = z.string().min(1).parse(formData.get("id"));
    await prisma.cabinetClient.update({
      where: { id, userId: workspace.workspaceUserId },
      data: { status: "ARCHIVED" },
    });
    revalidatePath("/app/cabinet");
  } catch (error) {
    target = `/app/cabinet?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
