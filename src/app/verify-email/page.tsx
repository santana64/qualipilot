import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { Field, SubmitButton, inputClass } from "@/components/ui";
import { resendVerificationAction, verifyEmailTokenAction } from "@/server/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";
  const verification = token ? await verifyEmailTokenAction(token) : null;
  const email = typeof params.email === "string" ? params.email : "";

  const isVerified = verification?.ok === true;

  return (
    <AuthCard
      title={isVerified ? "Email confirmé ✓" : "Vérifiez votre boîte mail"}
      description={
        isVerified
          ? "Votre adresse email a bien été vérifiée. Vous pouvez maintenant accéder à votre espace."
          : "Un email de confirmation a été envoyé. Cliquez sur le lien pour activer votre compte."
      }
      error={verification && !verification.ok ? verification.message : params.error}
      message={
        verification?.ok
          ? verification.message
          : params.sent
            ? "Un nouvel email de confirmation a été envoyé."
            : undefined
      }
    >
      {isVerified ? (
        /* Success state */
        <div className="grid gap-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-subtle py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-foreground">Compte activé avec succès</p>
          </div>
          <Link
            href="/app"
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Accéder à mon espace →
          </Link>
        </div>
      ) : (
        /* Pending / resend state */
        <div className="grid gap-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-subtle py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
              <Mail className="h-7 w-7 text-brand" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Consultez votre boîte mail</p>
              <p className="mt-1 text-xs text-foreground-faint">
                Pensez à vérifier vos spams si l&apos;email n&apos;arrive pas.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-foreground-muted">Email non reçu ? Renvoyez-en un :</p>
            <form action={resendVerificationAction} className="grid gap-3">
              <Field label="Votre adresse email">
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  defaultValue={email}
                  placeholder="vous@organisme.fr"
                  required
                />
              </Field>
              <SubmitButton variant="secondary">Renvoyer l&apos;email de confirmation</SubmitButton>
            </form>
          </div>

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
