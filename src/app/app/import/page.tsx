import { Upload } from "lucide-react";
import { Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { importTrainingProgramsCsvAction } from "@/server/actions/imports";

const headers = [
  "title",
  "category",
  "publicTarget",
  "prerequisites",
  "objectives",
  "duration",
  "accessDelay",
  "price",
  "modalities",
  "teachingMethods",
  "evaluationMethods",
  "accessibilityInfo",
  "contactInfo",
  "resultIndicators",
  "notes",
];

export default async function ImportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = (await searchParams) ?? {};

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Import CSV"
        description="Importez des formations existantes sans casser les limites d'abonnement ni le modele RNQ."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <SectionCard>
        <form action={importTrainingProgramsCsvAction} encType="multipart/form-data" className="grid gap-4">
          <Field label="Fichier CSV formations" hint="Encodage UTF-8, premiere ligne avec les en-tetes." required>
            <input className={inputClass} type="file" name="file" accept=".csv,text/csv" required />
          </Field>
          <SubmitButton>
            <Upload className="mr-2 h-4 w-4" />
            Importer les formations
          </SubmitButton>
        </form>
      </SectionCard>

      <SectionCard>
        <h2 className="font-bold text-foreground">Colonnes attendues</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Les champs obligatoires sont title, publicTarget, objectives, duration, modalities, teachingMethods et
          evaluationMethods.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-subtle p-4 text-xs text-foreground-muted">
          {headers.join(",")}
        </pre>
      </SectionCard>
    </main>
  );
}
