import { Sparkles } from "lucide-react";
import { Disclaimer, Notice, PageHeader, SectionCard, SubmitButton } from "@/components/ui";
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
        description="Generez une priorisation prudente a partir de vos indicateurs, preuves manquantes et actions en retard."
      />
      <Notice message={params.error} type="error" />

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
