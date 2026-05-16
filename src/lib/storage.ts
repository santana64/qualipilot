import path from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { DomainError } from "@/lib/errors";

const MAX_UPLOAD_BYTES = Number(process.env.MAX_EVIDENCE_UPLOAD_BYTES || 20 * 1024 * 1024);

const ALLOWED_MIME_PREFIXES = ["application/pdf", "image/", "text/", "application/vnd.", "application/msword"];

export type StoredEvidenceFile = {
  storageKey: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
};

export function getStorageRoot() {
  return process.env.LOCAL_FILE_STORAGE_DIR ? path.resolve(process.env.LOCAL_FILE_STORAGE_DIR) : path.resolve(".storage");
}

function cleanFileName(fileName: string) {
  const baseName = path.basename(fileName || "preuve");
  const cleaned = baseName.replace(/[^\w.\- ()]/g, "_").slice(0, 140);
  return cleaned || "preuve";
}

function assertAllowedFile(file: File) {
  if (!file || file.size === 0) return;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new DomainError(`Fichier trop volumineux. Limite actuelle : ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} Mo.`);
  }
  const mime = file.type || "application/octet-stream";
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => (prefix.endsWith("/") ? mime.startsWith(prefix) : mime === prefix || mime.startsWith(prefix)));
  if (!allowed) {
    throw new DomainError("Type de fichier non autorisé pour une preuve.");
  }
}

export async function storeEvidenceFile(userId: string, evidenceId: string, file: File): Promise<StoredEvidenceFile | null> {
  if (!file || file.size === 0) return null;
  assertAllowedFile(file);

  const safeName = cleanFileName(file.name);
  const storageKey = path.join("evidence", userId, evidenceId, `${randomUUID()}-${safeName}`).replaceAll("\\", "/");
  const absolutePath = resolveStorageKey(storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await pipeline(Readable.fromWeb(file.stream() as unknown as NodeReadableStream), createWriteStream(absolutePath));

  return {
    storageKey,
    fileName: safeName,
    fileMimeType: file.type || "application/octet-stream",
    fileSizeBytes: file.size,
  };
}

export function resolveStorageKey(storageKey: string) {
  const root = getStorageRoot();
  const absolutePath = path.resolve(root, storageKey);
  if (!absolutePath.startsWith(root)) {
    throw new DomainError("Chemin de fichier invalide.");
  }
  return absolutePath;
}

export async function readStoredFile(storageKey: string) {
  const absolutePath = resolveStorageKey(storageKey);
  const stats = await stat(absolutePath);
  return { stream: createReadStream(absolutePath), stats };
}
