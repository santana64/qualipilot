"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { getOptionalDate } from "@/lib/utils";
import { requireWorkspacePermission } from "@/server/rbac";

const profileSchema = z.object({
  organizationName: z.string().trim().min(2),
  legalForm: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  siren: z.string().trim().optional(),
  ndaNumber: z.string().trim().optional(),
  address: z.string().trim().min(2),
  postalCode: z.string().trim().min(2),
  city: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  activityTypes: z.array(z.string()).min(1),
  qualiopiStatus: z.enum(["NOT_CERTIFIED", "INITIAL_AUDIT_PLANNED", "CERTIFIED", "SURVEILLANCE_PLANNED", "RENEWAL_PLANNED"]),
  certifierName: z.string().trim().optional(),
  defaultSignature: z.string().trim().optional(),
  documentFooterText: z.string().trim().optional(),
});

export async function updateOrganizationProfileAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageSettings");
  let target = "/app/settings?success=Profil%20organisme%20mis%20%C3%A0%20jour.";
  try {
    const raw = {
      ...Object.fromEntries(formData),
      activityTypes: formData.getAll("activityTypes").map(String),
    };
    const parsed = profileSchema.parse(raw);
    await prisma.organizationProfile.upsert({
      where: { userId: workspace.workspaceUserId },
      update: {
        ...parsed,
        email: parsed.email || null,
        certificateDate: getOptionalDate(formData, "certificateDate") ?? null,
        certificateExpiryDate: getOptionalDate(formData, "certificateExpiryDate") ?? null,
        nextAuditDate: getOptionalDate(formData, "nextAuditDate") ?? null,
      },
      create: {
        ...parsed,
        email: parsed.email || null,
        userId: workspace.workspaceUserId,
        certificateDate: getOptionalDate(formData, "certificateDate"),
        certificateExpiryDate: getOptionalDate(formData, "certificateExpiryDate"),
        nextAuditDate: getOptionalDate(formData, "nextAuditDate"),
      },
    });
    revalidatePath("/app");
    revalidatePath("/app/settings");
  } catch (error) {
    target = `/app/settings?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
