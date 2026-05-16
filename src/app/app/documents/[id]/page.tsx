import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getWorkspaceContext } from "@/server/rbac";

export default async function DocumentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const workspace = await getWorkspaceContext();
  const { id } = await params;
  const document = await prisma.generatedDocument.findFirst({
    where: { id, userId: workspace.workspaceUserId },
  });
  if (!document) notFound();
  return (
    <main className="grid gap-6">
      <div className="no-print">
        <PageHeader
          title={document.title}
          description="Prévisualisation HTML imprimable. Utilisez l'impression du navigateur pour exporter en PDF."
          action={
            <div className="flex gap-3">
              <PrintButton />
              <Link href={`/app/documents/${document.id}/pdf`} className="inline-flex min-h-10 items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white">
                Télécharger PDF
              </Link>
              <Link href="/app/documents" className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
                Retour
              </Link>
            </div>
          }
        />
      </div>
      <article className="print-surface rounded-md border border-slate-200 bg-white p-8 shadow-sm" dangerouslySetInnerHTML={{ __html: document.contentHtml }} />
    </main>
  );
}
