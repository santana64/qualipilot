import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { PasswordInput } from "@/components/password-input";
import { Field, SubmitButton } from "@/components/ui";
import { resetPasswordAction } from "@/server/actions/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe fort d'au moins 8 caractères."
      error={params.error}
    >
      {!token ? (
        <div className="grid gap-4">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Demander un nouveau lien
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          <form action={resetPasswordAction} className="grid gap-4">
            <input type="hidden" name="token" value={token} />
            <Field label="Nouveau mot de passe" hint="8 caractères minimum">
              <PasswordInput
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
              />
            </Field>
            <SubmitButton>Mettre à jour le mot de passe</SubmitButton>
          </form>
          <Link
            className="text-center text-sm font-medium text-foreground-muted transition hover:text-foreground"
            href="/login"
          >
            ← Retour à la connexion
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
