"use server";

import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPlanLimits } from "@/domain/billing/plans";
import { prisma } from "@/lib/db";
import { BillingError, DomainError, toPublicError } from "@/lib/errors";
import { getUserPlan } from "@/server/billing";
import { requireWorkspacePermission } from "@/server/rbac";

const importedTrainingSchema = z.object({
  title: z.string().trim().min(2),
  category: z.string().trim().optional().default(""),
  publicTarget: z.string().trim().min(2),
  prerequisites: z.string().trim().optional().default(""),
  objectives: z.string().trim().min(2),
  duration: z.string().trim().min(1),
  accessDelay: z.string().trim().optional().default(""),
  price: z.string().trim().optional().default(""),
  modalities: z.string().trim().min(2),
  teachingMethods: z.string().trim().min(2),
  evaluationMethods: z.string().trim().min(2),
  accessibilityInfo: z.string().trim().optional().default(""),
  contactInfo: z.string().trim().optional().default(""),
  resultIndicators: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

const HEADER_ALIASES: Record<keyof z.infer<typeof importedTrainingSchema>, string[]> = {
  title: ["title", "titre", "intitule", "intitulé"],
  category: ["category", "categorie", "catégorie"],
  publicTarget: ["publicTarget", "publicCible", "public cible", "public", "publicVise", "public visé"],
  prerequisites: ["prerequisites", "prerequis", "prérequis"],
  objectives: ["objectives", "objectifs"],
  duration: ["duration", "duree", "durée"],
  accessDelay: ["accessDelay", "delaiAcces", "délai accès", "delai d'acces"],
  price: ["price", "prix", "prixEuros", "prix euros"],
  modalities: ["modalities", "modalite", "modalités", "modalites", "lieu"],
  teachingMethods: ["teachingMethods", "methodesPedagogiques", "méthodes pédagogiques", "methodes pedagogiques"],
  evaluationMethods: ["evaluationMethods", "methodesEvaluation", "méthodes évaluation", "methodes evaluation", "evaluation"],
  accessibilityInfo: ["accessibilityInfo", "accessibilite", "accessibilité", "handicap"],
  contactInfo: ["contactInfo", "contact"],
  resultIndicators: ["resultIndicators", "indicateursResultats", "indicateurs résultats", "resultats"],
  notes: ["notes", "commentaires"],
};

function parsePriceCents(value?: string) {
  if (!value) return null;
  const euros = Number(value.replace(",", "."));
  return Number.isFinite(euros) ? Math.round(euros * 100) : null;
}

function readAliasedValue(row: Record<string, string>, aliases: string[]) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const found = entries.find(([key]) => key.trim().toLowerCase() === alias.toLowerCase());
    if (found) return found[1];
  }
  return "";
}

function normalizeImportedRow(row: Record<string, string>) {
  const normalized = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([targetKey, aliases]) => [targetKey, readAliasedValue(row, aliases)]),
  ) as Record<keyof z.infer<typeof importedTrainingSchema>, string>;

  normalized.teachingMethods ||= "Methodes pedagogiques a completer apres import";
  normalized.evaluationMethods ||= "Methodes d'evaluation a completer apres import";
  normalized.modalities ||= "Modalites a completer apres import";
  return normalized;
}

export async function importTrainingProgramsCsvAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTraining");
  let target = "/app/import";

  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new DomainError("Fichier CSV introuvable.");
    }
    const isCsv =
      file.name.toLowerCase().endsWith(".csv") ||
      ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type);
    if (!isCsv) {
      throw new DomainError("Format invalide : importez un fichier CSV.");
    }
    if (file.size > 1024 * 1024) {
      throw new DomainError("CSV trop volumineux. Limite actuelle : 1 Mo.");
    }

    const rows = parse(await file.text(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[];

    if (rows.length === 0) throw new DomainError("Le CSV ne contient aucune ligne importable.");
    if (rows.length > 100) throw new DomainError("Import limite a 100 formations par fichier.");

    const plan = await getUserPlan(workspace.workspaceUserId);
    const limits = getPlanLimits(plan);
    const currentCount = await prisma.trainingProgram.count({
      where: { userId: workspace.workspaceUserId, status: { not: "ARCHIVED" } },
    });
    if (limits.trainingPrograms !== "unlimited" && currentCount + rows.length > limits.trainingPrograms) {
      throw new BillingError("Votre offre actuelle ne permet pas d'importer autant de formations.");
    }

    const parsedRows = rows.map((row) => importedTrainingSchema.parse(normalizeImportedRow(row)));
    await prisma.trainingProgram.createMany({
      data: parsedRows.map((row) => ({
        userId: workspace.workspaceUserId,
        title: row.title,
        category: row.category || null,
        publicTarget: row.publicTarget,
        prerequisites: row.prerequisites || null,
        objectives: row.objectives,
        duration: row.duration,
        accessDelay: row.accessDelay || null,
        priceCents: parsePriceCents(row.price),
        modalities: row.modalities,
        teachingMethods: row.teachingMethods,
        evaluationMethods: row.evaluationMethods,
        accessibilityInfo: row.accessibilityInfo || null,
        contactInfo: row.contactInfo || null,
        resultIndicators: row.resultIndicators || null,
        notes: row.notes || null,
        status: "DRAFT",
      })),
    });

    revalidatePath("/app");
    revalidatePath("/app/formations");
    target = `/app/import?success=${encodeURIComponent(`${parsedRows.length} formation(s) importee(s).`)}`;
  } catch (error) {
    target = `/app/import?error=${encodeURIComponent(toPublicError(error))}`;
  }

  redirect(target);
}
