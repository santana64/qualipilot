import { Sparkles } from "lucide-react";
import { ButtonLink, Disclaimer, Notice, PageHeader, SectionCard, SubmitButton } from "@/components/ui";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { requireUser } from "@/lib/auth/session";
import { generateAiAuditAdviceAction } from "@/server/actions/ai";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = (await searchParams) ?? {};

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Assistant IA audit"
        description="Analysez vos indicateurs, simulez un audit, mappez les preuves et surveillez les evolutions RNQ."
      />
      <Notice message={params.error} type="error" />

      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard>
          <h2 className="font-bold text-foreground">Simulateur d'audit IA</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Questions d'auditeur par indicateur, evaluation des reponses, rapport pret / a risque par critere.
          </p>
          <div className="mt-4">
            <ButtonLink href="/app/assistant/simulate">Lancer une simulation</ButtonLink>
          </div>
        </SectionCard>
        <SectionCard>
          <h2 className="font-bold text-foreground">Analyse automatique des preuves</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Analyse PDF ou texte et liaison automatique aux indicateurs RNQ avec justification.
          </p>
          <div className="mt-4">
            <ButtonLink href="/app/preuves" variant="secondary">Analyser une preuve</ButtonLink>
          </div>
        </SectionCard>
        <SectionCard>
          <h2 className="font-bold text-foreground">Veille et benchmark</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Surveillance RNQ et comparaison anonymisee avec les organismes similaires quand l'echantillon existe.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/app/veille" variant="secondary">Veille RNQ</ButtonLink>
            <ButtonLink href="/app/benchmark" variant="secondary">Benchmark</ButtonLink>
          </div>
        </SectionCard>
      </section>

      <SectionCard>
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="font-bold text-foreground">Priorisation avant audit</h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              L'IA produit un document de synthese sauvegarde dans vos documents. Si ANTHROPIC_API_KEY n'est pas
              configure, l'action echoue clairement sans simuler de resultat.
            </p>
          </div>
        </div>
        <form action={generateAiAuditAdviceAction} className="mt-5">
          <SubmitButton>
            <Sparkles className="mr-2 h-4 w-4" />
            Generer une priorisation IA
          </SubmitButton>
        </form>
      </SectionCard>

      <Disclaimer>{QUALIPILOT_DISCLAIMER}</Disclaimer>
    </main>
  );
}
