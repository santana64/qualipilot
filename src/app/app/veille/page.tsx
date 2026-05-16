import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge, Disclaimer, Notice, PageHeader, SectionCard, SubmitButton } from "@/components/ui";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { requireUser } from "@/lib/auth/session";
import { runRnqWatchAction } from "@/server/actions/rnq-watch";
import { getRnqWatchDashboard } from "@/server/rnq-watch";

function statusTone(status: string): "green" | "amber" | "red" | "slate" {
  if (status === "DETECTED") return "amber";
  if (status === "FAILED") return "red";
  if (status === "NO_CHANGE") return "green";
  return "slate";
}

export default async function RnqWatchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = (await searchParams) ?? {};
  const data = await getRnqWatchDashboard();

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Veille RNQ automatique"
        description="Surveillez une source RNQ configuree, detectez les changements et identifiez les indicateurs potentiellement impactes."
        action={
          <form action={runRnqWatchAction}>
            <SubmitButton>
              <Bell className="mr-2 h-4 w-4" />
              Verifier maintenant
            </SubmitButton>
          </form>
        }
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <SectionCard>
        <h2 className="font-bold text-foreground">Source surveillee</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Source par defaut ou variable <code>RNQ_WATCH_SOURCE_URL</code>. La surveillance ne remplace pas la verification du guide officiel par votre certificateur.
        </p>
        <Link className="mt-3 inline-block text-sm font-semibold text-brand hover:underline" href={data.sourceUrl} target="_blank">
          {data.sourceUrl}
        </Link>
      </SectionCard>

      <section className="grid gap-4">
        {data.events.length === 0 ? (
          <SectionCard>
            <p className="text-sm text-foreground-muted">Aucun evenement de veille enregistre.</p>
          </SectionCard>
        ) : null}
        {data.events.map((event) => (
          <SectionCard key={event.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-foreground">{event.sourceTitle}</h2>
                <p className="mt-1 text-xs text-foreground-faint">{event.createdAt.toLocaleString("fr-FR")}</p>
              </div>
              <Badge tone={statusTone(event.status)}>{event.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">{event.summary}</p>
            {event.impactedIndicatorNumbers.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {event.impactedIndicatorNumbers.map((number) => (
                  <Badge key={number} tone="blue">Ind. {number}</Badge>
                ))}
              </div>
            ) : null}
            <p className="mt-3 text-xs text-foreground-faint">
              Notifications envoyees : {event.notifications.filter((notification) => notification.status === "SENT").length}
            </p>
          </SectionCard>
        ))}
      </section>

      <Disclaimer>{QUALIPILOT_DISCLAIMER}</Disclaimer>
    </main>
  );
}
