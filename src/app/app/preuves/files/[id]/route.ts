import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";
import { getWorkspaceContext } from "@/server/rbac";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspace = await getWorkspaceContext();
  const { id } = await params;
  const evidence = await prisma.evidence.findFirst({
    where: { id, userId: workspace.workspaceUserId, status: { not: "ARCHIVED" } },
    select: {
      fileStorageKey: true,
      fileName: true,
      fileMimeType: true,
    },
  });

  if (!evidence?.fileStorageKey) {
    return NextResponse.json({ error: "Preuve introuvable." }, { status: 404 });
  }

  const { stream, stats } = await readStoredFile(evidence.fileStorageKey);
  return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
    headers: {
      "Content-Type": evidence.fileMimeType || "application/octet-stream",
      "Content-Length": String(stats.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(evidence.fileName || "preuve")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=60",
    },
  });
}
