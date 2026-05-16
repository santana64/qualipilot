import Link from "next/link";
import { Layers } from "lucide-react";
import { Badge, ButtonLink, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { formatMoney } from "@/domain/formatting";
import { requireUser } from "@/lib/auth/session";
import { trainingStatusLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";

function statusTone(status: string): "green" | "slate" | "amber" {
  if (status === "PUBLISHED") return "green";
  if (status === "ARCHIVED") return "slate";
  return "amber";
}

export default async function TrainingProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const clientId = typeof params.clientId === "string" ? params.clientId : null;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 24;

  const data = await getWorkspaceData(user.id, { clientId });

  const filtered = data.trainingCompleteness.filter(({ program }) => {
    const matchesQuery =
      !query ||
      program.title.toLowerCase().includes(query) ||
      (program.category ?? "").toLowerCase().includes(query) ||
      (program.client?.organizationName ?? "").toLowerCase().includes(query);
    const matchesStatus = !statusFilter || program.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function buildHref(overrides: Record<string, string | number | null>) {
    const p: Record<string, string> = {};
    if (clientId) p.clientId = clientId;
    if (query) p.q = query;
    if (statusFilter) p.status = statusFilter;
    p.page = String(page);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === null || v === "") delete p[k];
      else p[k] = String(v);
    });
    const qs = new URLSearchParams(p).toString();
    return `/app/formations${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Formations"
        description="Gérez les informations publiques et qualité de chaque programme de formation."
        action={
          <ButtonLink
            href={
              clientId
                ? `/app/formations/new?clientId=${encodeURIComponent(clientId)}`
                : "/app/formations/new"
            }
          >
            Nouvelle formation
          </ButtonLink>
        }
      />

      {/* Filters */}
      <form method="GET" action="/app/formations" className="flex flex-wrap gap-3">
        {clientId && <input type="hidden" name="clientId" value={clientId} />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Rechercher une formation…"
          className="h-9 flex-1 min-w-48 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLISHED">Publiée</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ARCHIVED">Archivée</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand/90"
        >
          Filtrer
        </button>
        {(query || statusFilter) && (
          <Link
            href={buildHref({ q: null, status: null, page: 1 })}
            className="h-9 flex items-center rounded-lg border border-border px-3 text-sm text-foreground-muted hover:text-foreground"
          >
            Effacer
          </Link>
        )}
      </form>

      {filtered.length === 0 ? (
        data.trainingCompleteness.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-10 w-10" />}
            title="Aucune formation"
            description="Ajoutez vos formations pour vérifier les informations publiques attendues, les objectifs, les modalités et les preuves associées."
            action={
              <ButtonLink
                href={
                  clientId
                    ? `/app/formations/new?clientId=${encodeURIComponent(clientId)}`
                    : "/app/formations/new"
                }
              >
                Créer une formation
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            icon={<Layers className="h-10 w-10" />}
            title="Aucun résultat"
            description="Aucune formation ne correspond à votre recherche."
            action={
              <Link
                href={buildHref({ q: null, status: null, page: 1 })}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Effacer les filtres
              </Link>
            }
          />
        )
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {pageItems.map(({ program, completeness }) => (
            <Link
              key={program.id}
              href={`/app/formations/${program.id}`}
              className="group rounded-xl bg-surface p-5 shadow-card transition hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{program.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {program.client ? `${program.client.organizationName} — ` : ""}
                    {program.category ?? "Catégorie non renseignée"}
                    {program.priceCents ? ` — ${formatMoney(program.priceCents)}` : ""}
                  </p>
                </div>
                <Badge tone={statusTone(program.status)}>
                  {trainingStatusLabels[program.status]}
                </Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={completeness.score} />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {completeness.score} % complété
                  </p>
                  {completeness.missingFields.length > 0 ? (
                    <span className="text-xs text-amber-700">
                      {completeness.missingFields.length} champ(s) manquant(s)
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-700">Complet</span>
                  )}
                </div>
              </div>
              {completeness.missingFields.length > 0 ? (
                <p className="mt-3 text-xs text-amber-700">
                  Manque : {completeness.missingFields.slice(0, 3).join(", ")}
                  {completeness.missingFields.length > 3
                    ? ` et ${completeness.missingFields.length - 3} autre(s)`
                    : ""}
                </p>
              ) : (
                <p className="mt-3 text-xs text-emerald-700">
                  Informations publiques complètes.
                </p>
              )}
            </Link>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between rounded-xl bg-surface p-4 text-sm shadow-card">
          <Link
            className="font-semibold text-brand hover:underline"
            href={buildHref({ page: Math.max(1, page - 1) })}
          >
            Page précédente
          </Link>
          <span className="text-foreground-muted">
            Page {page} / {totalPages}
            {filtered.length !== data.trainingCompleteness.length
              ? ` — ${filtered.length} résultat(s)`
              : ""}
          </span>
          <Link
            className="font-semibold text-brand hover:underline"
            href={buildHref({ page: Math.min(totalPages, page + 1) })}
          >
            Page suivante
          </Link>
        </nav>
      )}
    </main>
  );
}
