"use server";

import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateSessionScore, buildAuditorQuestion, selectSimulationIndicators, verdictFromScore } from "@/domain/ai-audit/simulator";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { prisma } from "@/lib/db";
import { DomainError, NotFoundError, toPublicError } from "@/lib/errors";
import { readStoredFile } from "@/lib/storage";
import { assertValidClientForUser } from "@/server/cabinet";
import { createAnthropicContentMessage, createAnthropicTextMessage, escapeHtml, extractJsonObject, textToHtmlArticle } from "@/server/ai-utils";
import { getWorkspaceData } from "@/server/app-data";
import { assertCanGenerateDocument } from "@/server/billing";
import { requireWorkspacePermission } from "@/server/rbac";

const startSimulationSchema = z.object({
  clientId: z.string().optional(),
  certifierPersona: z.string().trim().min(2).default("Auditeur Qualiopi"),
});

const answerSchema = z.object({
  answerId: z.string().min(1),
  sessionId: z.string().min(1),
  answerText: z.string().trim().min(20, "Reponse trop courte pour une evaluation utile."),
});

type EvaluationJson = {
  score?: number;
  verdict?: "READY" | "WARNING" | "AT_RISK" | "CRITICAL";
  gaps?: string[];
  recommendations?: string[];
  expectedEvidence?: string[];
};

type EvidenceAnalysisJson = {
  summary?: string;
  confidenceScore?: number;
  indicators?: Array<{
    number?: number;
    confidence?: number;
    rationale?: string;
  }>;
  gaps?: string[];
};

function clampScore(score: unknown) {
  const value = typeof score === "number" && Number.isFinite(score) ? score : 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const output = Buffer.alloc(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export async function createAuditSimulationSessionAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageAudit");
  let target = "/app/assistant/simulate";
  try {
    await assertCanGenerateDocument(workspace.workspaceUserId);
    const parsed = startSimulationSchema.parse(Object.fromEntries(formData));
    const clientId = parsed.clientId || null;
    const client = await assertValidClientForUser(workspace.workspaceUserId, clientId);
    const data = await getWorkspaceData(workspace.workspaceUserId, { clientId });
    const evidenceExamplesByIndicatorId = new Map(
      data.criteria.flatMap((criterion) =>
        criterion.indicators.map((indicator) => [indicator.id, indicator.evidenceExamples] as const),
      ),
    );
    const selected = selectSimulationIndicators(
      data.indicatorRows.map((indicator) => ({
        ...indicator,
        evidenceExamples: evidenceExamplesByIndicatorId.get(indicator.id) ?? [],
      })),
      12,
    );
    if (selected.length === 0) {
      throw new DomainError("Aucun indicateur applicable a simuler.");
    }
    const session = await prisma.aiAuditSession.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        title: client ? `Simulation audit - ${client.organizationName}` : "Simulation audit Qualiopi",
        certifierPersona: parsed.certifierPersona,
        answers: {
          create: selected.map((indicator) => ({
            indicatorId: indicator.id,
            question: buildAuditorQuestion(indicator, parsed.certifierPersona),
            gaps: [],
            recommendations: [],
            expectedEvidence: indicator.evidenceExamples,
          })),
        },
      },
    });
    target = `/app/assistant/simulate?sessionId=${session.id}&success=${encodeURIComponent("Simulation creee.")}`;
  } catch (error) {
    target = `/app/assistant/simulate?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function answerAuditSimulationQuestionAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageAudit");
  let target = "/app/assistant/simulate";
  try {
    await assertCanGenerateDocument(workspace.workspaceUserId);
    const parsed = answerSchema.parse(Object.fromEntries(formData));
    const answer = await prisma.aiAuditAnswer.findFirst({
      where: {
        id: parsed.answerId,
        session: { id: parsed.sessionId, userId: workspace.workspaceUserId },
      },
      include: {
        indicator: { include: { criterion: true } },
        session: true,
      },
    });
    if (!answer) throw new NotFoundError("Question de simulation introuvable.");

    const prompt = [
      "Tu joues le role d'un auditeur Qualiopi prudent. Evalue la reponse de l'organisme sans garantir la certification.",
      "Retourne uniquement un JSON valide avec: score nombre 0-100, verdict READY|WARNING|AT_RISK|CRITICAL, gaps tableau de lacunes concretes, recommendations tableau d'actions concretes, expectedEvidence tableau de preuves a presenter.",
      `Critere ${answer.indicator.criterion.number}: ${answer.indicator.criterion.title}`,
      `Indicateur ${answer.indicator.number}: ${answer.indicator.title}`,
      `Niveau attendu: ${answer.indicator.expectedLevel}`,
      `Exemples de preuves: ${answer.indicator.evidenceExamples.join(", ")}`,
      `Question auditeur: ${answer.question}`,
      `Reponse de l'OF: ${parsed.answerText}`,
      `Disclaimer obligatoire: ${QUALIPILOT_DISCLAIMER}`,
    ].join("\n");

    const text = await createAnthropicTextMessage({ prompt, maxTokens: 1200 });
    const result = extractJsonObject<EvaluationJson>(text);
    const score = clampScore(result.score);
    const verdict = result.verdict ?? verdictFromScore(score);

    await prisma.aiAuditAnswer.update({
      where: { id: answer.id },
      data: {
        answerText: parsed.answerText,
        evaluationScore: score,
        verdict,
        gaps: result.gaps?.slice(0, 8) ?? [],
        recommendations: result.recommendations?.slice(0, 8) ?? [],
        expectedEvidence: result.expectedEvidence?.slice(0, 8) ?? answer.indicator.evidenceExamples,
      },
    });

    const allAnswers = await prisma.aiAuditAnswer.findMany({
      where: { sessionId: answer.sessionId },
      select: { evaluationScore: true },
    });
    const globalScore = calculateSessionScore(allAnswers.map((item) => item.evaluationScore));
    await prisma.aiAuditSession.update({
      where: { id: answer.sessionId },
      data: {
        globalScore,
        verdict: globalScore > 0 ? verdictFromScore(globalScore) : null,
      },
    });

    target = `/app/assistant/simulate?sessionId=${answer.sessionId}&success=${encodeURIComponent("Reponse evaluee.")}`;
  } catch (error) {
    const sessionId = String(formData.get("sessionId") ?? "");
    target = `/app/assistant/simulate${sessionId ? `?sessionId=${sessionId}&` : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function finalizeAuditSimulationSessionAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageAudit");
  let target = "/app/assistant/simulate";
  try {
    await assertCanGenerateDocument(workspace.workspaceUserId);
    const sessionId = String(formData.get("sessionId") ?? "");
    const session = await prisma.aiAuditSession.findFirst({
      where: { id: sessionId, userId: workspace.workspaceUserId },
      include: {
        client: true,
        answers: {
          include: { indicator: { include: { criterion: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!session) throw new NotFoundError("Simulation introuvable.");
    if (session.answers.every((answer) => !answer.answerText)) {
      throw new DomainError("Repondez au moins a une question avant de generer le rapport.");
    }

    const answerContext = session.answers
      .map((answer) =>
        [
          `Indicateur ${answer.indicator.number} / Critere ${answer.indicator.criterion.number}`,
          `Question: ${answer.question}`,
          `Reponse: ${answer.answerText || "non repondue"}`,
          `Score: ${answer.evaluationScore ?? "non evalue"}`,
          `Lacunes: ${answer.gaps.join("; ") || "aucune"}`,
          `Actions: ${answer.recommendations.join("; ") || "aucune"}`,
        ].join(" | "),
      )
      .join("\n");

    const prompt = [
      "Redige un rapport de simulation d'audit Qualiopi en francais, structure par critere.",
      "Le rapport doit dire pret / a risque / critique par critere, lister les preuves attendues, les lacunes et les priorites avant audit.",
      "Ne garantis jamais la certification. Termine par le disclaimer.",
      `Session: ${session.title}`,
      `Persona auditeur: ${session.certifierPersona}`,
      `Client cabinet: ${session.client?.organizationName ?? "organisme principal"}`,
      `Score global actuel: ${session.globalScore}`,
      answerContext,
      QUALIPILOT_DISCLAIMER,
    ].join("\n");

    const report = await createAnthropicTextMessage({ prompt, maxTokens: 2200 });
    const title = `Rapport simulation audit - ${new Date().toLocaleDateString("fr-FR")}`;
    const reportHtml = `${textToHtmlArticle(title, report)}<aside class="disclaimer">${escapeHtml(QUALIPILOT_DISCLAIMER)}</aside>`;
    await prisma.aiAuditSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        reportText: `${report}\n\n${QUALIPILOT_DISCLAIMER}`,
        reportHtml,
        completedAt: new Date(),
      },
    });
    await prisma.generatedDocument.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: session.clientId,
        type: "AUDIT_SUMMARY",
        title,
        contentHtml: reportHtml,
        contentText: `${report}\n\n${QUALIPILOT_DISCLAIMER}`,
      },
    });
    target = `/app/assistant/simulate?sessionId=${session.id}&success=${encodeURIComponent("Rapport de simulation genere.")}`;
  } catch (error) {
    const sessionId = String(formData.get("sessionId") ?? "");
    target = `/app/assistant/simulate${sessionId ? `?sessionId=${sessionId}&` : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function analyzeEvidenceWithAiAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageEvidence");
  let target = "/app/preuves";
  try {
    await assertCanGenerateDocument(workspace.workspaceUserId);
    const evidenceId = String(formData.get("evidenceId") ?? "");
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId: workspace.workspaceUserId },
      include: { indicatorLinks: { include: { indicator: true } } },
    });
    if (!evidence) throw new NotFoundError("Preuve introuvable.");
    target = evidence.clientId ? `/app/preuves?clientId=${evidence.clientId}` : "/app/preuves";

    const indicators = await prisma.rnqIndicator.findMany({
      orderBy: { number: "asc" },
      include: { criterion: true },
    });
    const referential = indicators
      .map((indicator) => `Indicateur ${indicator.number} / Critere ${indicator.criterion.number}: ${indicator.title}. Niveau attendu: ${indicator.expectedLevel}. Preuves: ${indicator.evidenceExamples.join(", ")}`)
      .join("\n");
    const prompt = [
      "Analyse cette preuve Qualiopi/RNQ et propose les indicateurs qu'elle couvre.",
      "Retourne uniquement un JSON valide avec: summary string, confidenceScore nombre 0-100, indicators tableau {number, confidence, rationale}, gaps tableau.",
      "Ne mappe un indicateur que si le contenu ou les metadonnees le justifient. Utilise une formulation prudente.",
      `Titre preuve: ${evidence.title}`,
      `Type: ${evidence.type}`,
      `Description: ${evidence.description ?? "non renseignee"}`,
      `Notes: ${evidence.notes ?? "non renseignees"}`,
      `Referentiel:\n${referential}`,
    ].join("\n");

    const content: ContentBlockParam[] = [];
    if (evidence.fileStorageKey && evidence.fileMimeType === "application/pdf") {
      const stored = await readStoredFile(evidence.fileStorageKey);
      const buffer = await streamToBuffer(stored.stream);
      content.push({
        type: "document",
        title: evidence.fileName ?? evidence.title,
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buffer.toString("base64"),
        },
      });
    } else if (evidence.fileStorageKey && evidence.fileMimeType?.startsWith("text/")) {
      const stored = await readStoredFile(evidence.fileStorageKey);
      const buffer = await streamToBuffer(stored.stream);
      content.push({
        type: "document",
        title: evidence.fileName ?? evidence.title,
        source: {
          type: "text",
          media_type: "text/plain",
          data: buffer.toString("utf8").slice(0, 120000),
        },
      });
    }
    content.push({ type: "text", text: prompt });

    const text = await createAnthropicContentMessage({ content, maxTokens: 1800 });
    const result = extractJsonObject<EvidenceAnalysisJson>(text);
    const recommended = (result.indicators ?? [])
      .map((item) => ({
        number: Number(item.number),
        confidence: clampScore(item.confidence),
      }))
      .filter((item) => Number.isInteger(item.number) && item.confidence >= 60);
    const linkedNumbers = recommended.filter((item) => item.confidence >= 70).map((item) => item.number);
    const indicatorsByNumber = new Map(indicators.map((indicator) => [indicator.number, indicator]));

    await prisma.evidenceIndicator.createMany({
      data: linkedNumbers
        .map((number) => indicatorsByNumber.get(number))
        .filter((indicator): indicator is (typeof indicators)[number] => Boolean(indicator))
        .map((indicator) => ({
          evidenceId: evidence.id,
          indicatorId: indicator.id,
        })),
      skipDuplicates: true,
    });

    await prisma.evidenceAiAnalysis.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: evidence.clientId,
        evidenceId: evidence.id,
        summary: result.summary ?? "Analyse IA terminee.",
        confidenceScore: clampScore(result.confidenceScore),
        recommendedIndicatorNumbers: recommended.map((item) => item.number),
        linkedIndicatorNumbers: linkedNumbers,
        gaps: result.gaps?.slice(0, 10) ?? [],
        rawResultJson: result,
      },
    });

    target = `${target}${target.includes("?") ? "&" : "?"}success=${encodeURIComponent(`${linkedNumbers.length} indicateur(s) lies par l'analyse IA.`)}`;
  } catch (error) {
    target = `${target}${target.includes("?") ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
