import { notFound } from "next/navigation";
import { Badge, Disclaimer, PageHeader, ProgressBar, SectionCard } from "@/components/ui";
import { hashToken } from "@/domain/auth/tokens";
import { formatFrenchDate, formatPercent } from "@/domain/formatting";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { prisma } from "@/lib/db";
import { indicatorStatusLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";

export default async function AuditorSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await prisma.auditorShareLink.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true } } },
  });

  if (!share || share.revokedAt || share.expiresAt <= new Date()) notFound();

  await prisma.auditorShareLink.update({
    where: { id: share.id },
    data: { lastViewedAt: new Date() },
  });

  const data = await getWorkspaceData(share.userId, { clientId: share.clientId });

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10">
      <PageHeader
        title="Dossier preparatoire QualiPilot"
        description={
          data.activeClient
            ? `Lien lecture seule limite au client ${data.activeClient.organizationName}, valable jusqu'au ${formatFrenchDate(share.expiresAt)}.`
            : `Lien lecture seule valable jusqu'au ${formatFrenchDate(share.expiresAt)}.`
        }
      />

      <SectionCard>
        <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-faint">Organisation</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              {data.organization?.organizationName ?? "Profil organisme incomplet"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Prochain audit : {formatFrenchDate(data.latestAudit?.scheduledDate ?? data.organization?.nextAuditDate)}
            </p>
          </div>
          <div>
            <div className="flex items-end justify-between gap-4">
              <p className="text-sm font-semibold text-foreground">Niveau de preparation</p>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {formatPercent(data.globalReadinessScore)}
              </p>
            </div>
            <div className="mt-3">
              <ProgressBar value={data.globalReadinessScore} />
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <h2 className="font-bold text-foreground">Synthese par critere</h2>
          <div className="mt-4 grid gap-3">
            {data.criterionScores.map(({ criterion, score, readyCount, totalCount }) => (
              <div key={criterion.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Critere {criterion.number}</p>
                  <Badge tone={score >= 85 ? "green" : score >= 60 ? "amber" : "red"}>{formatPercent(score)}</Badge>
                </div>
                <div className="mt-2">
                  <ProgressBar value={score} />
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  {readyCount}/{totalCount} indicateurs prets
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="font-bold text-foreground">Points a verifier</h2>
          <div className="mt-4 grid gap-3">
            {data.missingEvidence.slice(0, 12).map((indicator) => (
              <div key={indicator.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold text-foreground">Indicateur {indicator.number}</p>
                <p className="mt-1 text-foreground-muted">{indicator.title}</p>
              </div>
            ))}
            {data.missingEvidence.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-sm text-foreground-muted">
                Aucun indicateur sans preuve active.
              </p>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <SectionCard>
        <h2 className="font-bold text-foreground">Indicateurs RNQ</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-foreground-faint">
                <th className="py-2 pr-3">N</th>
                <th className="py-2 pr-3">Indicateur</th>
                <th className="py-2 pr-3">Statut</th>
                <th className="py-2 pr-3">Preuves</th>
              </tr>
            </thead>
            <tbody>
              {data.indicatorRows.map((indicator) => (
                <tr key={indicator.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3 font-semibold text-foreground">{indicator.number}</td>
                  <td className="py-3 pr-3 text-foreground-muted">{indicator.title}</td>
                  <td className="py-3 pr-3">{indicatorStatusLabels[indicator.status]}</td>
                  <td className="py-3 pr-3">{indicator.evidenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Disclaimer>{QUALIPILOT_DISCLAIMER}</Disclaimer>
    </main>
  );
}
