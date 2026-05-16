import Link from "next/link";
import { ShieldCheck, Lock, CreditCard, Zap } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { PasswordInput } from "@/components/password-input";
import { Field, SubmitButton, inputClass } from "@/components/ui";
import { registerAction } from "@/server/actions/auth";

const trustSignals = [
  { icon: Zap, label: "Gratuit pour toujours", sub: "Aucune carte requise" },
  { icon: Lock, label: "Données sécurisées", sub: "Hébergé en France" },
  { icon: CreditCard, label: "Sans engagement", sub: "Résiliez à tout moment" },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <AuthCard
      title="Créez votre espace qualité"
      description="Préparez votre audit Qualiopi en moins de 10 minutes."
      error={params.error}
    >
      <form action={registerAction} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Votre prénom">
            <input
              className={inputClass}
              name="name"
              autoComplete="given-name"
              placeholder="Marie"
              required
            />
          </Field>
          <Field label="Organisme de formation">
            <input
              className={inputClass}
              name="organizationName"
              placeholder="Mon OF SARL"
              required
            />
          </Field>
        </div>
        <Field label="Adresse email professionnelle">
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@organisme.fr"
            required
          />
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum">
          <PasswordInput name="password" autoComplete="new-password" required minLength={8} placeholder="••••••••" />
        </Field>
        <SubmitButton>Créer mon compte gratuit →</SubmitButton>
      </form>

      {/* Trust signals */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        {trustSignals.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-subtle px-2 py-3 text-center">
            <Icon className="h-4 w-4 text-accent" />
            <p className="text-[11px] font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-foreground-faint">{sub}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-foreground-faint">
        En créant un compte, vous acceptez nos{" "}
        <Link className="underline hover:text-foreground-muted" href="/conditions-generales">conditions d&apos;utilisation</Link>
        {" "}et notre{" "}
        <Link className="underline hover:text-foreground-muted" href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <div className="mt-5 text-center text-sm">
        <span className="text-foreground-muted">Déjà inscrit ? </span>
        <Link className="font-semibold text-accent hover:text-accent-hover" href="/login">
          Se connecter →
        </Link>
      </div>
    </AuthCard>
  );
}
