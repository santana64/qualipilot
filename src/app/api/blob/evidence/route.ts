import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { assertAllowedEvidenceUpload, cleanEvidenceFileName, isVercelBlobConfigured } from "@/lib/storage";
import { requireWorkspacePermission } from "@/server/rbac";

type ClientPayload = {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
};

function parsePayload(payload: string | null): ClientPayload {
  if (!payload) return {};
  try {
    return JSON.parse(payload) as ClientPayload;
  } catch {
    return {};
  }
}

function isAllowedPathname(pathname: string, workspaceUserId: string) {
  return pathname.startsWith(`evidence/${workspaceUserId}/pending/`) && !pathname.includes("..");
}

export async function POST(request: Request) {
  if (!isVercelBlobConfigured()) {
    return NextResponse.json({ error: "Vercel Blob non configure." }, { status: 400 });
  }

  const workspace = await requireWorkspacePermission("manageEvidence");
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parsePayload(clientPayload);
        assertAllowedEvidenceUpload({
          size: Number(payload.fileSize ?? 0),
          type: payload.fileType || "application/octet-stream",
        });

        const safeName = cleanEvidenceFileName(payload.fileName || pathname);
        const expectedPrefix = `evidence/${workspace.workspaceUserId}/pending/`;
        if (!isAllowedPathname(pathname, workspace.workspaceUserId) || !pathname.endsWith(safeName)) {
          throw new Error("Chemin Blob invalide.");
        }

        return {
          allowedContentTypes: [payload.fileType || "application/octet-stream"],
          maximumSizeInBytes: Number(process.env.MAX_EVIDENCE_UPLOAD_BYTES || 20 * 1024 * 1024),
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({
            workspaceUserId: workspace.workspaceUserId,
            prefix: expectedPrefix,
          }),
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload Blob impossible." },
      { status: 400 },
    );
  }
}
