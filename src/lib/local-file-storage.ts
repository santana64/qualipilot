import path from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { DomainError } from "@/lib/errors";

export type LocalStoredFileReadResult = {
  stream: ReadableStream<Uint8Array>;
  size: number;
};

function getStorageRoot() {
  return path.join(process.cwd(), ".storage");
}

function resolveStorageKey(storageKey: string) {
  const root = getStorageRoot();
  const safeRelativePath = storageKey.replace(/^[/\\]+/, "");
  const segments = safeRelativePath.split(/[\\/]+/).filter(Boolean);
  if (segments.some((segment) => segment === "..")) {
    throw new DomainError("Chemin de fichier invalide.");
  }
  return path.join(root, ...segments);
}

export async function storeLocalEvidenceFile(storageKey: string, file: File) {
  const absolutePath = resolveStorageKey(storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await pipeline(Readable.fromWeb(file.stream() as unknown as NodeReadableStream), createWriteStream(absolutePath));
}

export async function readLocalStoredFile(storageKey: string): Promise<LocalStoredFileReadResult> {
  const absolutePath = resolveStorageKey(storageKey);
  const stats = await stat(absolutePath);
  return {
    stream: Readable.toWeb(createReadStream(absolutePath)) as ReadableStream<Uint8Array>,
    size: stats.size,
  };
}

export async function deleteLocalStoredFile(storageKey: string) {
  const absolutePath = resolveStorageKey(storageKey);
  await rm(absolutePath, { force: true }).catch(() => undefined);
}
