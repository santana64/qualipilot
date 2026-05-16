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
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = [
      "Tu es un assistant qualite prudent pour un organisme de formation francais.",
      "Ne garantis jamais la certification Qualiopi. Utilise une formulation prudente.",
      "Produis une priorisation concrete en francais: risques, preuves a produire, actions prioritaires.",
      `Organisation: ${data.organization?.organizationName ?? "profil incomplet"}`,
      `Score global: ${data.globalReadinessScore}%.`,
      `Preuves manquantes: ${data.missingEvidence.slice(0, 12).map((item) => `Indicateur ${item.number} - ${item.title}`).join("; ") || "aucune"}.`,
      `Actions en retard: ${data.overdueActions.slice(0, 8).map((item) => item.title).join("; ") || "aucune"}.`,
      `Formations incompletes: ${data.trainingCompleteness.filter((item) => !item.completeness.isComplete).map((item) => item.program.title).join("; ") || "aucune"}.`,
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
