import { Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { qualiopiStatusLabels } from "@/lib/labels";
import { prisma } from "@/lib/db";
import { updateOrganizationProfileAction } from "@/server/actions/organization";
import { requireWorkspacePermission } from "@/server/rbac";

const activityTypes = [
  ["training actions", "Actions de formation"],
  ["apprenticeship", "Apprentissage"],
  ["VAE", "VAE"],
  ["skills assessment", "Bilan de compétences"],
  ["subcontracting", "Sous-traitance"],
];

function dateValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await requireWorkspacePermission("manageSettings");
  const params = (await searchParams) ?? {};
  const profile = await prisma.organizationProfile.findUnique({ where: { userId: workspace.workspaceUserId } });
  return (
    <main className="grid gap-8">
      <PageHeader
        title="Réglages organisme"
        description="Ces informations alimentent les documents qualité générés et l'export du dossier audit."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <form action={updateOrganizationProfileAction} className="grid gap-6">
        {/* Identity */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Identité de l&apos;organisme</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom de l'organisme" required>
              <input className={inputClass} name="organizationName" defaultValue={profile?.organizationName ?? ""} required />
            </Field>
            <Field label="Forme juridique">
              <input className={inputClass} name="legalForm" defaultValue={profile?.legalForm ?? ""} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="SIRET">
              <input className={inputClass} name="siret" defaultValue={profile?.siret ?? ""} />
            </Field>
            <Field label="SIREN">
              <input className={inputClass} name="siren" defaultValue={profile?.siren ?? ""} />
            </Field>
            <Field label="N° de déclaration d'activité (NDA)">
              <input className={inputClass} name="ndaNumber" defaultValue={profile?.ndaNumber ?? ""} />
            </Field>
          </div>
        </SectionCard>

        {/* Coordonnées */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Coordonnées</h2>
          <Field label="Adresse" required>
            <input className={inputClass} name="address" defaultValue={profile?.address ?? ""} required />
          </Field>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Code postal" required>
              <input className={inputClass} name="postalCode" defaultValue={profile?.postalCode ?? ""} required />
            </Field>
            <Field label="Ville" required>
              <input className={inputClass} name="city" defaultValue={profile?.city ?? ""} required />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Email organisme">
              <input className={inputClass} name="email" type="email" defaultValue={profile?.email ?? ""} />
            </Field>
            <Field label="Téléphone">
              <input className={inputClass} name="phone" defaultValue={profile?.phone ?? ""} />
            </Field>
            <Field label="Site web">
              <input className={inputClass} name="website" defaultValue={profile?.website ?? ""} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Personne contact">
              <input className={inputClass} name="contactPerson" defaultValue={profile?.contactPerson ?? ""} />
            </Field>
          </div>
        </SectionCard>

        {/* Activities */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Activités de formation</h2>
          <fieldset>
            <div className="grid gap-3 md:grid-cols-2">
              {activityTypes.map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="activityTypes"
                    value={value}
                    defaultChecked={(profile?.activityTypes ?? []).includes(value)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </SectionCard>

        {/* Qualiopi status */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Statut Qualiopi et audit</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Statut Qualiopi">
              <select className={inputClass} name="qualiopiStatus" defaultValue={profile?.qualiopiStatus ?? "NOT_CERTIFIED"}>
                {Object.entries(qualiopiStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Certificateur">
              <input className={inputClass} name="certifierName" defaultValue={profile?.certifierName ?? ""} placeholder="Ex. : Bureau Veritas, Afnor..." />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Date certificat">
              <input className={inputClass} name="certificateDate" type="date" defaultValue={dateValue(profile?.certificateDate)} />
            </Field>
            <Field label="Expiration certificat">
              <input className={inputClass} name="certificateExpiryDate" type="date" defaultValue={dateValue(profile?.certificateExpiryDate)} />
            </Field>
            <Field label="Prochain audit">
              <input className={inputClass} name="nextAuditDate" type="date" defaultValue={dateValue(profile?.nextAuditDate)} />
            </Field>
          </div>
        </SectionCard>

        {/* Documents */}
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Documents et signatures</h2>
          <p className="mb-4 text-sm text-slate-500">Ces informations apparaissent dans les documents générés et le dossier audit.</p>
          <Field label="Signature par défaut">
            <textarea className={textareaClass} name="defaultSignature" defaultValue={profile?.defaultSignature ?? ""} placeholder="Nom, qualité, signature..." />
          </Field>
          <div className="mt-4">
            <Field label="Pied de page documents">
              <textarea className={textareaClass} name="documentFooterText" defaultValue={profile?.documentFooterText ?? ""} placeholder="Ex. : Organisme certifié Qualiopi — SIRET XXXXX" />
            </Field>
          </div>
        </SectionCard>

        <div>
          <SubmitButton>Enregistrer le profil organisme</SubmitButton>
        </div>
      </form>
    </main>
  );
}
