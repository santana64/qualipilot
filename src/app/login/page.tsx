import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { PasswordInput } from "@/components/password-input";
import { Field, SubmitButton, inputClass } from "@/components/ui";
import { loginAction } from "@/server/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <AuthCard
      title="Bon retour 👋"
      description="Connectez-vous pour accéder à votre espace qualité."
      error={params.error}
      message={params.message}
    >
      <form action={loginAction} className="grid gap-5">
        <input type="hidden" name="next" value={typeof params.next === "string" ? params.next : "/app"} />
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
        <Field label="Mot de passe">
          <PasswordInput name="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton>Se connecter</SubmitButton>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          className="font-medium text-foreground-muted transition hover:text-foreground"
          href="/forgot-password"
        >
          Mot de passe oublié ?
        </Link>
        <Link className="font-semibold text-accent hover:text-accent-hover" href="/register">
          Créer un compte gratuit →
        </Link>
      </div>
    </AuthCard>
  );
}
