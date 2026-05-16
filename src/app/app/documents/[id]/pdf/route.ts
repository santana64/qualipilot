import { prisma } from "@/lib/db";
import { pdfResponse, renderPdfBuffer } from "@/lib/pdf";
import { getWorkspaceContext } from "@/server/rbac";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspace = await getWorkspaceContext();
  const { id } = await params;
  const document = await prisma.generatedDocument.findFirst({
    where: { id, userId: workspace.workspaceUserId },
  });
  if (!document) {
    return new Response("Document introuvable", { status: 404 });
  }
  const buffer = await renderPdfBuffer({
    title: document.title,
    contentHtml: document.contentHtml,
    contentText: document.contentText,
  });
  return pdfResponse(buffer, `${document.title}.pdf`);
}
