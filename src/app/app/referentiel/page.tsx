import Link from "next/link";
import { Badge, ButtonLink, Disclaimer, PageHeader, ProgressBar, SectionCard, inputClass } from "@/components/ui";
import { formatPercent } from "@/domain/formatting";
import { indicatorStatusLabels, riskLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { getWorkspaceContext } from "@/server/rbac";

function toneForStatus(status: string): "green" | "amber" | "red" | "slate" | "violet" {
  if (status === "READY" || status === "VALIDATED") return "green";
  if (status === "NEEDS_REVIEW") return "amber";
  if (status === "IN_PROGRESS") return "blue" as "slate";
  if (status === "NOT_APPLICABLE") return "violet";
  return "slate";
}

function toneForRisk(risk: string): "red" | "amber" | "slate" {
  if (risk === "CRITICAL") return "red";
  if (risk === "HIGH") return "amber";
  return "slate";
}

export default async function ReferentielPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await getWorkspaceContext();
  const params = (await searchParams) ?? {};
  const clientId = typeof params.clientId === "string" ? params.clientId : null;
  const data = await getWorkspaceData(workspace.workspaceUserId, { clientId });
  const status = typeof params.status === "string" ? params.status : "";
  const criterion = typeof params.criterion === "string" ? params.criterion : "";
  const risk = typeof params.risk === "string" ? params.risk : "";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const missing = params.missing === "1";

  const rows = data.indicatorRows.filter((row) => {
    if (status && row.status !== status) return false;
    if (criterion && String(row.criterionNumber) !== criterion) return false;
    if (risk && row.riskLevel !== risk) return false;
    if (missing && row.evidenceCount > 0) return false;
    if (query) {
      const haystack = `${row.number} ${row.title} ${row.shortDescription} ${row.expectedLevel}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Référentiel RNQ"
        description="7 critères, 32 indicateurs — statuts, preuves associées et niveau de préparation."
        action={<ButtonLink href={clientId ? `/app/preuves?clientId=${encodeURIComponent(clientId)}` : "/app/preuves"}>Ajouter une preuve</ButtonLink>}
      />

      {/* Criterion overview grid */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Vue par critère
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {data.criterionScores.map(({ criterion: c, score, readyCount, totalCount }) => (
            <Link
              key={c.id}
              href={`/app/referentiel?criterion=${c.number}${clientId ? `&clientId=${encodeURIComponent(clientId)}` : ""}`}
              className="group rounded-xl bg-surface p-4 shadow-card transition hover:shadow-raised"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Critère {c.number}</p>
              <p className="mt-1 text-xs leading-5 text-slate-700 line-clamp-2">{c.title}</p>
              <div className="mt-3">
                <ProgressBar value={score} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">{formatPercent(score)}</p>
                <p className="text-xs text-slate-500">{readyCount}/{totalCount}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Filters */}
      <form className="grid gap-3 rounded-xl bg-surface p-4 shadow-card md:grid-cols-5">
        {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
        <input className={inputClass} name="q" placeholder="Rechercher un indicateur..." defaultValue={query} />
        <select className={inputClass} name="status" defaultValue={status}>
          <option value="">Tous les statuts</option>
          {Object.entries(indicatorStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className={inputClass} name="criterion" defaultValue={criterion}>
          <option value="">Tous les critères</option>
          {data.criteria.map((item) => (
            <option key={item.id} value={item.number}>
              Critère {item.number}
            </option>
          ))}
        </select>
        <select className={inputClass} name="risk" defaultValue={risk}>
          <option value="">Tous les risques</option>
          {Object.entries(riskLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {missing ? <input type="hidden" name="missing" value="1" /> : null}
        <button
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
          type="submit"
        >
          Filtrer
        </button>
      </form>

      {/* Summary */}
      <p className="text-sm text-slate-500">
        {rows.length} indicateur{rows.length > 1 ? "s" : ""} affiché{rows.length > 1 ? "s" : ""}
      </p>

      {/* Indicator table */}
      <SectionCard className="overflow-hidden p-0">
        <div className="grid grid-cols-[60px_1fr_140px_110px_90px] gap-3 border-b border-border bg-surface-subtle px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-foreground-faint">
          <span>N°</span>
          <span>Indicateur</span>
          <span>Statut</span>
          <span>Risque</span>
          <span className="text-right">Score</span>
        </div>
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/app/referentiel/${row.id}${clientId ? `?clientId=${encodeURIComponent(clientId)}` : ""}`}
            className="grid grid-cols-[60px_1fr_140px_110px_90px] gap-3 border-b border-border px-4 py-4 text-sm transition-colors last:border-0 hover:bg-brand-subtle"
          >
            <span className="font-bold text-brand">#{row.number}</span>
            <span className="text-slate-800">{row.title}</span>
            <span>
              <Badge tone={toneForStatus(row.status)}>{indicatorStatusLabels[row.status]}</Badge>
            </span>
            <span>
              <Badge tone={toneForRisk(row.riskLevel)}>{riskLabels[row.riskLevel]}</Badge>
            </span>
            <span className="text-right font-semibold text-slate-900">{formatPercent(row.readinessScore)}</span>
          </Link>
        ))}
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Aucun indicateur ne correspond aux filtres sélectionnés.
          </div>
        ) : null}
      </SectionCard>

      <Disclaimer>
        À vérifier selon votre situation et le guide officiel RNQ. QualiPilot ne garantit pas la certification.
      </Disclaimer>
    </main>
  );
}
