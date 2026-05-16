import { PageHeader, SectionCard, ProgressBar, EmptyState } from "@/components/ui";
import { formatFrenchDate, formatPercent } from "@/domain/formatting";
import { prisma } from "@/lib/db";
import { getWorkspaceContext } from "@/server/rbac";

export default async function ReadinessHistoryPage() {
  const workspace = await getWorkspaceContext();
  const snapshots = await prisma.readinessSnapshot.findMany({
    where: { userId: workspace.workspaceUserId },
    orderBy: { capturedAt: "desc" },
    take: 90,
    include: { client: true },
  });

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Historique du score"
        description="Suivez l'evolution du niveau de preparation pour prouver le pilotage continu du dossier qualite."
      />

      {snapshots.length === 0 ? (
        <EmptyState
          title="Aucun historique disponible"
          description="Le score est capture automatiquement une fois par jour lorsque vous utilisez l'application."
        />
      ) : (
        <SectionCard>
          <div className="grid gap-3">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatFrenchDate(snapshot.capturedAt)}
                      {snapshot.client ? ` - ${snapshot.client.organizationName}` : ""}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {snapshot.indicatorsReady} indicateurs prets, {snapshot.indicatorsIncomplete} incomplets,{" "}
                      {snapshot.missingEvidenceCount} preuves manquantes, {snapshot.overdueActionsCount} actions en
                      retard
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {formatPercent(snapshot.globalReadinessScore)}
                  </p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={snapshot.globalReadinessScore} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </main>
  );
}
