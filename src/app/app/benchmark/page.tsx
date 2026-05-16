import { LineChart } from "lucide-react";
import { Badge, Disclaimer, Notice, PageHeader, ProgressBar, SectionCard, StatCard } from "@/components/ui";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { requireUser } from "@/lib/auth/session";
import { getBenchmarkData } from "@/server/benchmark";

export default async function BenchmarkPage() {
  const user = await requireUser();
  const benchmark = await getBenchmarkData(user.id);

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Benchmark anonymise"
        description="Comparez votre niveau de preparation avec des organismes similaires quand l'echantillon anonymise est suffisant."
      />
      {!benchmark.hasEnoughSimilarData ? (
        <Notice
          type="info"
          message="Echantillon similaire insuffisant : QualiPilot affiche une tendance globale anonymisee quand elle existe, sans identifier aucun organisme."
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Votre preparation" value={`${benchmark.currentScore} %`} detail="Score global actuel" />
        <StatCard
          label="Moyenne anonymisee"
          value={benchmark.benchmarkScore === null ? "N/A" : `${benchmark.benchmarkScore} %`}
          detail={`${benchmark.sampleSize} organisme(s) dans l'echantillon`}
          tone="blue"
        />
        <StatCard
          label="Ecart"
          value={benchmark.benchmarkScore === null ? "N/A" : `${benchmark.currentScore - benchmark.benchmarkScore} pts`}
          detail={`Segment ${benchmark.sizeBand}`}
          tone={benchmark.benchmarkScore !== null && benchmark.currentScore < benchmark.benchmarkScore ? "amber" : "green"}
        />
      </section>

      <SectionCard>
        <div className="flex items-start gap-3">
          <LineChart className="mt-1 h-5 w-5 text-accent" />
          <div className="w-full">
            <h2 className="font-bold text-foreground">Indicateurs ou vous etes le plus en retard</h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              Calcul anonyme sur les scores d'indicateurs disponibles. Aucun nom d'organisme n'est expose.
            </p>
            <div className="mt-5 grid gap-4">
              {benchmark.topIndicatorGaps.length === 0 ? (
                <p className="text-sm text-foreground-muted">Pas encore assez de donnees comparables par indicateur.</p>
              ) : null}
              {benchmark.topIndicatorGaps.map((gap) => (
                <div key={gap.indicatorNumber} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Badge tone="blue">Ind. {gap.indicatorNumber}</Badge>
                      <h3 className="mt-2 font-semibold text-foreground">{gap.title}</h3>
                    </div>
                    <Badge tone="amber">-{gap.gap} pts</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-foreground-faint">Vous</p>
                      <ProgressBar value={gap.currentScore} />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-faint">Benchmark</p>
                      <ProgressBar value={gap.benchmarkScore} tone="blue" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="font-bold text-foreground">Maturite operationnelle</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="text-sm leading-6 text-foreground-muted">
            Preuves manquantes moyennes observees : {benchmark.benchmarkMissingEvidence ?? "N/A"}.
          </p>
          <p className="text-sm leading-6 text-foreground-muted">
            Actions en retard moyennes observees : {benchmark.benchmarkOverdueActions ?? "N/A"}.
          </p>
        </div>
      </SectionCard>

      <Disclaimer>{QUALIPILOT_DISCLAIMER}</Disclaimer>
    </main>
  );
}
