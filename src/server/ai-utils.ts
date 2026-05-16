import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam, MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { DomainError } from "@/lib/errors";

export type AnthropicTextBlock = { type: string; text?: string };

export function requireAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new DomainError("Service IA non configure.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function textFromMessage(content: AnthropicTextBlock[]) {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export async function createAnthropicTextMessage(input: {
  prompt: string;
  maxTokens?: number;
}) {
  const client = requireAnthropicClient();
  const message = (await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: input.maxTokens ?? 1500,
    messages: [{ role: "user", content: input.prompt }],
  })) as { content: AnthropicTextBlock[] };
  return textFromMessage(message.content);
}

export async function createAnthropicContentMessage(input: {
  content: ContentBlockParam[];
  maxTokens?: number;
}) {
  const client = requireAnthropicClient();
  const messages: MessageParam[] = [{ role: "user", content: input.content }];
  const message = (await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: input.maxTokens ?? 1600,
    messages,
  })) as { content: AnthropicTextBlock[] };
  return textFromMessage(message.content);
}

export function extractJsonObject<T>(text: string): T {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced ?? text.match(/\{[\s\S]*\}/)?.[0] ?? "";
  if (!raw) throw new DomainError("Reponse IA inexploitable.");
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new DomainError("Reponse IA JSON invalide.");
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function textToHtmlArticle(title: string, text: string) {
  return `<article><h1>${escapeHtml(title)}</h1>${text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("")}</article>`;
}
