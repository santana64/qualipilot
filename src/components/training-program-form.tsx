import { Field, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { trainingStatusLabels } from "@/lib/labels";

type TrainingProgramFormValue = {
  id: string;
  title: string;
  category: string | null;
  publicTarget: string;
  prerequisites: string | null;
  objectives: string;
  duration: string;
  accessDelay: string | null;
  priceCents: number | null;
  modalities: string;
  teachingMethods: string;
  evaluationMethods: string;
  accessibilityInfo: string | null;
  contactInfo: string | null;
  resultIndicators: string | null;
  status: string;
  notes: string | null;
  clientId?: string | null;
};

type ClientOption = {
  id: string;
  organizationName: string;
};

export function TrainingProgramForm({
  action,
  program,
  clients = [],
  defaultClientId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  program?: TrainingProgramFormValue;
  clients?: ClientOption[];
  defaultClientId?: string | null;
}) {
  return (
    <form action={action} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      {program ? <input type="hidden" name="id" value={program.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Intitulé">
          <input className={inputClass} name="title" defaultValue={program?.title ?? ""} required />
        </Field>
        <Field label="Catégorie">
          <input className={inputClass} name="category" defaultValue={program?.category ?? ""} />
        </Field>
      </div>
      {clients.length > 0 ? (
        <Field label="Client cabinet">
          <select className={inputClass} name="clientId" defaultValue={program?.clientId ?? defaultClientId ?? ""}>
            <option value="">Aucun client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.organizationName}</option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Public visé">
        <textarea className={textareaClass} name="publicTarget" defaultValue={program?.publicTarget ?? ""} required />
      </Field>
      <Field label="Prérequis">
        <textarea className={textareaClass} name="prerequisites" defaultValue={program?.prerequisites ?? ""} />
      </Field>
      <Field label="Objectifs">
        <textarea className={textareaClass} name="objectives" defaultValue={program?.objectives ?? ""} required />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Durée">
          <input className={inputClass} name="duration" defaultValue={program?.duration ?? ""} required />
        </Field>
        <Field label="Délai d'accès">
          <input className={inputClass} name="accessDelay" defaultValue={program?.accessDelay ?? ""} />
        </Field>
        <Field label="Prix TTC (€)">
          <input className={inputClass} name="price" inputMode="decimal" defaultValue={program?.priceCents ? String(program.priceCents / 100) : ""} />
        </Field>
      </div>
      <Field label="Modalités">
        <textarea className={textareaClass} name="modalities" defaultValue={program?.modalities ?? ""} required />
      </Field>
      <Field label="Méthodes pédagogiques">
        <textarea className={textareaClass} name="teachingMethods" defaultValue={program?.teachingMethods ?? ""} required />
      </Field>
      <Field label="Méthodes d'évaluation">
        <textarea className={textareaClass} name="evaluationMethods" defaultValue={program?.evaluationMethods ?? ""} required />
      </Field>
      <Field label="Information handicap / accessibilité">
        <textarea className={textareaClass} name="accessibilityInfo" defaultValue={program?.accessibilityInfo ?? ""} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Contact">
          <input className={inputClass} name="contactInfo" defaultValue={program?.contactInfo ?? ""} />
        </Field>
        <Field label="Statut">
          <select className={inputClass} name="status" defaultValue={program?.status ?? "DRAFT"}>
            {Object.entries(trainingStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Indicateurs de résultats">
        <textarea className={textareaClass} name="resultIndicators" defaultValue={program?.resultIndicators ?? ""} />
      </Field>
      <Field label="Notes internes">
        <textarea className={textareaClass} name="notes" defaultValue={program?.notes ?? ""} />
      </Field>
      <SubmitButton>{program ? "Enregistrer la formation" : "Créer la formation"}</SubmitButton>
    </form>
  );
}
