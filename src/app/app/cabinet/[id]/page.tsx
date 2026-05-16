import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, ProgressBar, SectionCard, StatCard } from "@/components/ui";
import { formatPercent } from "@/domain/formatting";
import { getWorkspaceData } from "@/server/app-data";
import { requireWorkspacePermission } from "@/server/rbac";

export default async function CabinetClientDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const workspace = await requireWorkspacePermission("manageCabinet");
  const { id } = await params;
  const data = await getWorkspaceData(workspace.workspaceUserId, { clientId: id }).catch(() => null);
  if (!data?.activeClient) notFound();

  return (
    <main className="grid gap-8">
      <PageHeader
        title={data.activeClient.organizationName}
        description="Vue cabinet filtree cote serveur : formations, preuves, actions, documents et audit de ce client."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Score client" value={formatPercent(data.globalReadinessScore)} tone={data.globalReadinessScore >= 85 ? "green" : data.globalReadinessScore >= 60 ? "amber" : "red"} />
        <StatCard label="Formations" value={data.trainingPrograms.length} href={`/app/formations?clientId=${encodeURIComponent(id)}`} />
        <StatCard label="Preuves" value={data.evidences.length} href={`/app/preuves?clientId=${encodeURIComponent(id)}`} />
        <StatCard label="Actions en retard" value={data.overdueActions.length} tone={data.overdueActions.length > 0 ? "red" : "green"} href={`/app/actions?overdue=1&clientId=${encodeURIComponent(id)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <h2 className="font-bold text-foreground">Progression par critere</h2>
          <div className="mt-4 grid gap-3">
            {data.criterionScores.map(({ criterion, score }) => (
              <Link key={criterion.id} href={`/app/referentiel?criterion=${criterion.number}&clientId=${encodeURIComponent(id)}`} className="rounded-lg border border-border p-3 hover:bg-brand-subtle">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Critere {criterion.number}</p>
                  <p className="text-sm font-bold text-foreground">{formatPercent(score)}</p>
                </div>
                <div className="mt-2">
                  <ProgressBar value={score} />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="font-bold text-foreground">Points manquants client</h2>
          <div className="mt-4 grid gap-3">
            {data.missingEvidence.slice(0, 10).map((indicator) => (
              <Link key={indicator.id} href={`/app/referentiel/${indicator.id}?clientId=${encodeURIComponent(id)}`} className="rounded-lg border border-border p-3 text-sm hover:bg-brand-subtle">
                <span className="font-semibold text-foreground">Indicateur {indicator.number}</span>
                <span className="mt-1 block text-foreground-muted">{indicator.title}</span>
              </Link>
            ))}
            {data.missingEvidence.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-sm text-foreground-muted">Aucun indicateur sans preuve active pour ce client.</p>
            ) : null}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
