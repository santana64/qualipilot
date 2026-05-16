import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { Field, SubmitButton, inputClass } from "@/components/ui";
import { forgotPasswordAction } from "@/server/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const sent = !!params.sent;

  return (
    <AuthCard
      title="Mot de passe oublié ?"
      description="Pas d'inquiétude. Indiquez votre email et nous vous enverrons un lien pour en choisir un nouveau."
      error={params.error}
    >
      {sent ? (
        <div className="grid gap-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-subtle py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
              <KeyRound className="h-7 w-7 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Email envoyé</p>
              <p className="mt-1 text-xs text-foreground-faint">
                Si un compte existe, vous recevrez un lien de réinitialisation dans quelques minutes.
                <br />Pensez à vérifier vos spams.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
          >
            ← Retour à la connexion
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          <form action={forgotPasswordAction} className="grid gap-4">
            <Field label="Adresse email">
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@organisme.fr"
                required
              />
            </Field>
            <SubmitButton>Envoyer le lien de réinitialisation</SubmitButton>
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
