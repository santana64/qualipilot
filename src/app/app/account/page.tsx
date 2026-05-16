import Link from "next/link";
import { Badge, Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { formatFrenchDate } from "@/domain/formatting";
import { resendVerificationAction } from "@/server/actions/auth";
import { changePasswordAction, deleteAccountAction, updateAccountAction } from "@/server/actions/account";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  return (
    <main className="grid gap-8">
      <PageHeader title="Mon compte" description="Gérez vos informations personnelles, votre sécurité et vos droits sur les données." />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Informations du compte</h2>
          <form action={updateAccountAction} className="grid gap-4">
            <Field label="Nom">
              <input className={inputClass} name="name" defaultValue={user.name ?? ""} />
            </Field>
            <Field label="Email" required>
              <input className={inputClass} name="email" type="email" defaultValue={user.email} required />
            </Field>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">Vérification :</span>
              {user.emailVerifiedAt ? (
                <Badge tone="green">Vérifié le {formatFrenchDate(user.emailVerifiedAt)}</Badge>
              ) : (
                <Badge tone="amber">Non vérifié</Badge>
              )}
            </div>
            <SubmitButton>Mettre à jour</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-5 font-bold text-slate-900">Mot de passe</h2>
          <form action={changePasswordAction} className="grid gap-4">
            <Field label="Mot de passe actuel" required>
              <input className={inputClass} name="currentPassword" type="password" required />
            </Field>
            <Field label="Nouveau mot de passe" hint="8 caractères minimum." required>
              <input className={inputClass} name="newPassword" type="password" required minLength={8} />
            </Field>
            <SubmitButton>Changer le mot de passe</SubmitButton>
          </form>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard>
          <h2 className="mb-3 font-bold text-slate-900">Vérification email</h2>
          <p className="text-sm leading-6 text-slate-600">
            Renvoie un lien de vérification si le service email est configuré.
          </p>
          <form action={resendVerificationAction} className="mt-4">
            <input type="hidden" name="email" value={user.email} />
            <SubmitButton variant="secondary">Renvoyer le lien</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-3 font-bold text-slate-900">Export de données</h2>
          <p className="text-sm leading-6 text-slate-600">
            Téléchargez un export JSON complet de vos données QualiPilot (droit à la portabilité).
          </p>
          <div className="mt-4">
            <Link
              className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
              href="/app/account/export"
            >
              Exporter mes données
            </Link>
          </div>
        </SectionCard>

        {/* Destructive zone */}
        <div className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-rose-800">Supprimer le compte</h2>
          <p className="text-sm leading-6 text-slate-600">
            Suppression définitive et irréversible du compte et de toutes les données associées.
          </p>
          <form action={deleteAccountAction} className="mt-4 grid gap-3">
            <Field label="Tapez SUPPRIMER pour confirmer">
              <input className={inputClass} name="confirmation" placeholder="SUPPRIMER" />
            </Field>
            <SubmitButton variant="danger">Supprimer définitivement</SubmitButton>
          </form>
        </div>
      </section>
    </main>
  );
}
