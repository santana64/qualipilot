import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import { DomainError } from "@/lib/errors";

const MAX_UPLOAD_BYTES = Number(process.env.MAX_EVIDENCE_UPLOAD_BYTES || 20 * 1024 * 1024);
const ALLOWED_MIME_PREFIXES = ["application/pdf", "image/", "text/", "application/vnd.", "application/msword"];
const BLOB_STORAGE_PREFIX = "vercel-blob:";

export type StoredEvidenceFile = {
  storageKey: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
};

export type StoredFileReadResult = {
  stream: ReadableStream<Uint8Array>;
  size: number;
  contentType?: string | null;
  etag?: string | null;
};

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN || "";
}

export function isVercelBlobConfigured() {
  return Boolean(getBlobToken());
}

export function cleanEvidenceFileName(fileName: string) {
  const baseName = (fileName || "preuve").split(/[\\/]/).pop() || "preuve";
  const cleaned = baseName.replace(/[^\w.\- ()]/g, "_").slice(0, 140);
  return cleaned || "preuve";
}

export function assertAllowedEvidenceUpload(input: { size: number; type?: string | null }) {
  if (!input || input.size === 0) return;
  if (input.size > MAX_UPLOAD_BYTES) {
    throw new DomainError(`Fichier trop volumineux. Limite actuelle : ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} Mo.`);
  }
  const mime = input.type || "application/octet-stream";
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? mime.startsWith(prefix) : mime === prefix || mime.startsWith(prefix),
  );
  if (!allowed) {
    throw new DomainError("Type de fichier non autorise pour une preuve.");
  }
}

export function toBlobStorageKey(pathname: string) {
  return `${BLOB_STORAGE_PREFIX}${pathname.replace(/^\/+/, "")}`;
}

function fromBlobStorageKey(storageKey: string) {
  return storageKey.startsWith(BLOB_STORAGE_PREFIX) ? storageKey.slice(BLOB_STORAGE_PREFIX.length) : null;
}

function createEvidencePath(userId: string, evidenceId: string, safeName: string) {
  return ["evidence", userId, evidenceId, `${randomUUID()}-${safeName}`].join("/");
}

function assertAllowedFile(file: File) {
  assertAllowedEvidenceUpload({ size: file.size, type: file.type });
}

export async function storeEvidenceFile(userId: string, evidenceId: string, file: File): Promise<StoredEvidenceFile | null> {
  if (!file || file.size === 0) return null;
  assertAllowedFile(file);

  const safeName = cleanEvidenceFileName(file.name);
  const blobToken = getBlobToken();
  if (blobToken) {
    const pathname = createEvidencePath(userId, evidenceId, safeName);
    const blob = await put(pathname, file, {
      access: "private",
      allowOverwrite: false,
      contentType: file.type || "application/octet-stream",
      maximumSizeInBytes: MAX_UPLOAD_BYTES,
      multipart: file.size > 4 * 1024 * 1024,
      token: blobToken,
    });

    return {
      storageKey: toBlobStorageKey(blob.pathname),
      fileName: safeName,
      fileMimeType: blob.contentType || file.type || "application/octet-stream",
      fileSizeBytes: file.size,
    };
  }

  if (process.env.VERCEL) {
    throw new DomainError("Stockage fichier persistant non configure : ajoutez BLOB_READ_WRITE_TOKEN pour Vercel Blob.");
  }

  const storageKey = createEvidencePath(userId, evidenceId, safeName);
  const { storeLocalEvidenceFile } = await import("@/lib/local-file-storage");
  await storeLocalEvidenceFile(storageKey, file);

  return {
    storageKey,
    fileName: safeName,
    fileMimeType: file.type || "application/octet-stream",
    fileSizeBytes: file.size,
  };
}

export async function readStoredFile(storageKey: string): Promise<StoredFileReadResult> {
  const blobPathname = fromBlobStorageKey(storageKey);
  if (blobPathname) {
    const blobToken = getBlobToken();
    if (!blobToken) {
      throw new DomainError("Stockage fichier Vercel Blob non configure.");
    }
    const result = await get(blobPathname, { access: "private", token: blobToken });
    if (!result || result.statusCode !== 200) {
      throw new DomainError("Fichier preuve introuvable.");
    }
    return {
      stream: result.stream,
      size: result.blob.size,
      contentType: result.blob.contentType,
      etag: result.blob.etag,
    };
  }

  const { readLocalStoredFile } = await import("@/lib/local-file-storage");
  return readLocalStoredFile(storageKey);
}

export async function deleteStoredFile(storageKey: string | null | undefined) {
  if (!storageKey) return;
  const blobPathname = fromBlobStorageKey(storageKey);
  if (blobPathname) {
    const blobToken = getBlobToken();
    if (!blobToken) return;
    await del(blobPathname, { token: blobToken }).catch(() => undefined);
    return;
  }

  const { deleteLocalStoredFile } = await import("@/lib/local-file-storage");
  await deleteLocalStoredFile(storageKey);
}
