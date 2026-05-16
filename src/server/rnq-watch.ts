import { createHash } from "node:crypto";
import { DEFAULT_RNQ_INDICATORS } from "@/domain/rnq/default-referential";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { DomainError } from "@/lib/errors";
import { createAnthropicTextMessage, extractJsonObject } from "@/server/ai-utils";

const DEFAULT_SOURCE_URL = "https://bretagne.dreets.gouv.fr/Referentiel-national-qualite";

type RnqImpactJson = {
  detectedVersion?: string;
  summary?: string;
  impactedIndicatorNumbers?: number[];
};

function getSourceUrl() {
  return process.env.RNQ_WATCH_SOURCE_URL || DEFAULT_SOURCE_URL;
}

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function normalizeText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRnqSource() {
  const sourceUrl = getSourceUrl();
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "QualiPilot RNQ watch (+https://qualipilot.pro)",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new DomainError(`Veille RNQ impossible : source indisponible (${response.status}).`);
  }
  const html = await response.text();
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "Referentiel national qualite";
  return {
    sourceUrl,
    sourceTitle: title,
    text: normalizeText(html).slice(0, 160000),
  };
}

async function analyzeImpact(sourceText: string) {
  const referential = DEFAULT_RNQ_INDICATORS.map((indicator) =>
    `Indicateur ${indicator.number} / critere ${indicator.criterionNumber}: ${indicator.title}. ${indicator.shortDescription}`,
  ).join("\n");
  const prompt = [
    "Tu analyses une source officielle ou institutionnelle sur le RNQ/Qualiopi.",
    "Objectif: detecter les changements qui pourraient impacter les indicateurs QualiPilot.",
    "Retourne uniquement un JSON valide avec: detectedVersion string optionnel, summary string, impactedIndicatorNumbers tableau de numeros d'indicateurs.",
    "Sois prudent: si l'impact n'est pas clair, liste peu d'indicateurs et indique qu'une verification officielle est necessaire.",
    `Referentiel interne:\n${referential}`,
    `Source observee:\n${sourceText}`,
  ].join("\n");
  const text = await createAnthropicTextMessage({ prompt, maxTokens: 1400 });
  return extractJsonObject<RnqImpactJson>(text);
}

export async function runRnqWatch() {
  const source = await fetchRnqSource();
  const contentHash = hashContent(source.text);
  const latest = await prisma.rnqWatchEvent.findFirst({
    where: { sourceUrl: source.sourceUrl },
    orderBy: { createdAt: "desc" },
  });

  if (latest?.contentHash === contentHash) {
    return { changed: false, event: latest, notified: 0 };
  }

  if (!latest) {
    const event = await prisma.rnqWatchEvent.create({
      data: {
        sourceUrl: source.sourceUrl,
        sourceTitle: source.sourceTitle,
        contentHash,
        summary: "Baseline de veille RNQ enregistree. Aucun impact utilisateur n'est notifie sur la premiere capture.",
        impactedIndicatorNumbers: [],
        status: "NO_CHANGE",
      },
    });
    return { changed: false, event, notified: 0 };
  }

  let impact: RnqImpactJson | null = null;
  let status: "DETECTED" | "FAILED" = "DETECTED";
  try {
    impact = await analyzeImpact(source.text);
  } catch {
    status = "FAILED";
  }

  const event = await prisma.rnqWatchEvent.create({
    data: {
      sourceUrl: source.sourceUrl,
      sourceTitle: source.sourceTitle,
      contentHash,
      detectedVersion: impact?.detectedVersion,
      summary:
        impact?.summary ??
        "Changement detecte sur la source RNQ, mais l'analyse IA d'impact n'a pas pu etre finalisee.",
      impactedIndicatorNumbers: (impact?.impactedIndicatorNumbers ?? []).filter((number) =>
        DEFAULT_RNQ_INDICATORS.some((indicator) => indicator.number === number),
      ),
      rawResultJson: impact ?? undefined,
      status,
    },
  });

  const notified = await notifyRnqWatchEvent(event.id);
  return { changed: true, event, notified };
}

export async function notifyRnqWatchEvent(eventId: string) {
  const event = await prisma.rnqWatchEvent.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "DETECTED") return 0;
  const users = await prisma.user.findMany({
    where: { emailVerifiedAt: { not: null }, reminderEmailsUnsubscribedAt: null },
    select: { id: true, email: true, name: true },
    take: 500,
  });
  let sent = 0;
  for (const user of users) {
    const notification = await prisma.rnqWatchNotification.upsert({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      update: {},
      create: { eventId: event.id, userId: user.id },
    });
    if (notification.status === "SENT") continue;
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendEmail({
        to: user.email,
        subject: "Veille RNQ Qualiopi : point a verifier",
        html: `<h1>Veille RNQ Qualiopi</h1><p>${event.summary}</p><p>Indicateurs potentiellement impactes : ${event.impactedIndicatorNumbers.join(", ") || "a confirmer"}.</p><p><a href="${appUrl}/app/veille">Voir la veille dans QualiPilot</a></p>`,
        text: `Veille RNQ Qualiopi\n\n${event.summary}\n\nIndicateurs potentiellement impactes : ${event.impactedIndicatorNumbers.join(", ") || "a confirmer"}.\n\n${appUrl}/app/veille`,
      });
      await prisma.rnqWatchNotification.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null },
      });
      sent += 1;
    } catch (error) {
      await prisma.rnqWatchNotification.update({
        where: { id: notification.id },
        data: { status: "FAILED", lastError: error instanceof Error ? error.message : "Erreur inconnue" },
      });
    }
  }
  return sent;
}

export async function getRnqWatchDashboard() {
  const events = await prisma.rnqWatchEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { notifications: true },
  });
  return {
    sourceUrl: getSourceUrl(),
    events,
  };
}
