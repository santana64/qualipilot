"use server";

import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { prisma } from "@/lib/db";
import { DomainError, toPublicError } from "@/lib/errors";
import { getWorkspaceData } from "@/server/app-data";
import { assertCanGenerateDocument } from "@/server/billing";
import { requireWorkspacePermission } from "@/server/rbac";

type AnthropicTextBlock = { type: string; text?: string };

function textFromMessage(content: AnthropicTextBlock[]) {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export async function generateAiAuditAdviceAction() {
  const workspace = await requireWorkspacePermission("manageDocuments");
  let target = "/app/assistant";
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new DomainError("Service IA non configure.");
    }
    await assertCanGenerateDocument(workspace.workspaceUserId);
    const data = await getWorkspaceData(workspace.workspaceUserId);
    const evidenceByIndicator = new Map<number, string[]>();
    for (const evidence of data.evidences) {
      for (const link of evidence.indicatorLinks) {
        const current = evidenceByIndicator.get(link.indicator.number) ?? [];
        current.push(`${evidence.title} (${evidence.status})`);
        evidenceByIndicator.set(link.indicator.number, current);
      }
    }
    const actionsByIndicator = new Map<number, string[]>();
    for (const action of data.actions) {
      if (!action.indicator?.number) continue;
      const current = actionsByIndicator.get(action.indicator.number) ?? [];
      current.push(`${action.title} - ${action.status}${action.dueDate ? ` - echeance ${action.dueDate.toISOString().slice(0, 10)}` : ""}`);
      actionsByIndicator.set(action.indicator.number, current);
    }
    const indicatorContext = data.indicatorRows
      .map((indicator) => {
        const criterion = data.criteria.find((item) => item.number === indicator.criterionNumber);
        const evidenceList = evidenceByIndicator.get(indicator.number) ?? [];
        const actionList = actionsByIndicator.get(indicator.number) ?? [];
        return [
          `Indicateur ${indicator.number} / Critere ${indicator.criterionNumber} - ${criterion?.title ?? "critere non renseigne"}`,
          `Titre: ${indicator.title}`,
          `Risque: ${indicator.riskLevel}; statut: ${indicator.status}; score: ${indicator.readinessScore}%; preuves actives: ${indicator.evidenceCount}; actions ouvertes: ${indicator.actionCount}`,
          `Preuves liees: ${evidenceList.slice(0, 5).join(", ") || "aucune"}`,
          `Actions liees: ${actionList.slice(0, 5).join(", ") || "aucune"}`,
        ].join(" | ");
      })
      .join("\n");
    const incompleteTrainingContext = data.trainingCompleteness
      .filter((item) => !item.completeness.isComplete)
      .map((item) => `${item.program.title}: score ${item.completeness.score}%, champs manquants: ${item.completeness.missingFields.join(", ")}`)
      .join("\n");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = [
      "Tu es un assistant qualite Qualiopi/RNQ prudent pour un organisme de formation francais.",
      "Tu dois analyser les donnees RNQ reelles de l'utilisateur, pas produire du conseil generique.",
      "Ne garantis jamais la certification Qualiopi. Utilise une formulation prudente et renvoie vers une validation selon le guide RNQ et le certificateur.",
      "Produis une priorisation concrete en francais avec cette structure:",
      "1. Resume executif en 5 lignes maximum.",
      "2. Top 10 des indicateurs a traiter, classes par criticite puis absence de preuve.",
      "3. Pour chaque indicateur: risque, pourquoi c'est fragile, preuve exacte a produire, action recommandee, responsable suggere, delai conseille.",
      "4. Formations a completer.",
      "5. Questions a poser au certificateur si necessaire.",
      `Organisation: ${data.organization?.organizationName ?? "profil incomplet"}`,
      `Score global: ${data.globalReadinessScore}%.`,
      `Indicateurs RNQ detailles:\n${indicatorContext}`,
      `Actions en retard: ${data.overdueActions.slice(0, 12).map((item) => item.title).join("; ") || "aucune"}.`,
      `Formations incompletes:\n${incompleteTrainingContext || "aucune"}.`,
      `Disclaimer obligatoire: ${QUALIPILOT_DISCLAIMER}`,
    ].join("\n");

    const message = (await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    })) as { content: AnthropicTextBlock[] };
    const advice = textFromMessage(message.content);
    if (!advice) throw new DomainError("Impossible de generer le conseil IA.");

    const contentHtml = `<article><h1>Priorisation audit assistee par IA</h1>${advice
      .split(/\n{2,}/)
      .map((paragraph: string) => `<p>${paragraph.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`)
      .join("")}<aside class="disclaimer">${QUALIPILOT_DISCLAIMER}</aside></article>`;

    const document = await prisma.generatedDocument.create({
      data: {
        userId: workspace.workspaceUserId,
        type: "AUDIT_SUMMARY",
        title: "Priorisation audit assistee par IA",
        contentHtml,
        contentText: `${advice}\n\n${QUALIPILOT_DISCLAIMER}`,
      },
    });
    target = `/app/documents/${document.id}?success=Conseil%20IA%20genere.`;
  } catch (error) {
    target = `/app/assistant?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
