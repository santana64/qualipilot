import { canExportAuditFile } from "@/domain/billing/plans";
import { formatFrenchDate, formatPercent } from "@/domain/formatting";
import { pdfResponse, renderPdfBuffer } from "@/lib/pdf";
import { getWorkspaceData } from "@/server/app-data";
import { getUserPlan } from "@/server/billing";
import { getWorkspaceContext } from "@/server/rbac";

export async function GET() {
  const workspace = await getWorkspaceContext();
  const [data, plan] = await Promise.all([getWorkspaceData(workspace.workspaceUserId), getUserPlan(workspace.workspaceUserId)]);
  if (!canExportAuditFile(plan)) {
    return new Response("Votre offre actuelle ne permet pas cette action.", { status: 403 });
  }

  const contentText = [
    "Dossier preparatoire audit Qualiopi",
    `Organisme : ${data.organization?.organizationName ?? "Profil organisme incomplet"}`,
    `Adresse : ${[data.organization?.address, data.organization?.postalCode, data.organization?.city].filter(Boolean).join(" ")}`,
    `Prochaine echeance : ${formatFrenchDate(data.latestAudit?.scheduledDate ?? data.organization?.nextAuditDate)}`,
    `Niveau global : ${formatPercent(data.globalReadinessScore)}`,
    `Indicateurs prets : ${data.indicatorsReady}`,
    `Indicateurs incomplets : ${data.indicatorsIncomplete}`,
    `Preuves manquantes : ${data.missingEvidence.length}`,
    `Actions en retard : ${data.overdueActions.length}`,
    "",
    "## Resume par critere",
    ...data.criterionScores.map(({ criterion, score }) => `- Critere ${criterion.number} - ${criterion.title} : ${formatPercent(score)}`),
    "",
    "## Indicateurs RNQ",
    ...data.indicatorRows.map((indicator) => `- ${indicator.number} - ${indicator.title} : ${indicator.status} (${indicator.readinessScore} %) - preuves ${indicator.evidenceCount}`),
    "",
    "## Preuves",
    ...data.evidences.map((evidence) => `- ${evidence.title} - ${evidence.type} - indicateurs ${evidence.indicatorLinks.map((link) => link.indicator.number).join(", ") || "a associer"}`),
    "",
    "## Formations",
    ...data.trainingCompleteness.map(({ program, completeness }) => `- ${program.title} - completude ${formatPercent(completeness.score)} - manque ${completeness.missingFields.join(", ") || "rien a signaler"}`),
    "",
    "## Plan d'action",
    ...data.actions.map((action) => `- ${action.title} - ${action.status} - echeance ${formatFrenchDate(action.dueDate)}`),
    "",
    "## Points manquants",
    ...data.missingEvidence.map((indicator) => `- Indicateur ${indicator.number} : preuve associee a verifier.`),
    ...data.expiredEvidence.map((evidence) => `- Preuve expiree : ${evidence.title}.`),
    ...data.overdueActions.map((action) => `- Action en retard : ${action.title}.`),
  ].join("\n");

  const buffer = await renderPdfBuffer({
    title: "Dossier preparatoire audit Qualiopi",
    contentText,
  });
  return pdfResponse(buffer, "dossier-audit-qualipilot.pdf");
}
