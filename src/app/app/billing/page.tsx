import { CheckCircle2, CreditCard } from "lucide-react";
import { Badge, Notice, PageHeader, SectionCard, SubmitButton } from "@/components/ui";
import { getPlanLimits } from "@/domain/billing/plans";
import { formatFrenchDate } from "@/domain/formatting";
import { prisma } from "@/lib/db";
import { createBillingPortalSessionAction, createCheckoutSessionAction } from "@/server/actions/billing";
import { getUsage } from "@/server/billing";
import { requireWorkspacePermission } from "@/server/rbac";

const plans = [
  {
    id: "FREE" as const,
    name: "Free",
    monthly: { price: "0 €", period: "" },
    yearly: { price: "0 €", period: "" },
    description: "Pour explorer le référentiel et démarrer.",
    highlight: false,
    target: "Formateur débutant",
  },
  {
    id: "STARTER" as const,
    name: "Starter",
    monthly: { price: "49 €", period: "/mois" },
    yearly: { price: "490 €", period: "/an" },
    description: "Pour préparer un premier audit sérieusement.",
    highlight: false,
    target: "OF en préparation initiale",
  },
  {
    id: "PRO" as const,
    name: "Pro",
    monthly: { price: "89 €", period: "/mois" },
    yearly: { price: "890 €", period: "/an" },
    description: "Pour les OFs actifs en maintenance continue.",
    highlight: true,
    target: "OF certifié en surveillance",
  },
  {
    id: "CABINET" as const,
    name: "Cabinet",
    monthly: { price: "149 €", period: "/mois" },
    yearly: { price: "1 490 €", period: "/an" },
    description: "Pour gérer plusieurs organismes en portefeuille.",
    highlight: false,
    target: "Consultant qualité formation",
  },
];

function limitLabel(value: number | "unlimited") {
  return value === "unlimited" ? "Illimité" : String(value);
}

function UsageBar({ used, limit }: { used: number; limit: number | "unlimited" }) {
  if (limit === "unlimited") return <span className="text-xs text-emerald-700">Illimité</span>;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const tone = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{used} utilisé(s)</span>
        <span>sur {limit}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await requireWorkspacePermission("manageBilling");
  const params = (await searchParams) ?? {};
  const billing = (params.billing as string) === "yearly" ? "yearly" : "monthly";
  const usage = await getUsage(workspace.workspaceUserId);
  const subscription = await prisma.subscription.findUnique({ where: { userId: workspace.workspaceUserId } });

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Abonnement"
        description="Gérez votre offre et consultez vos limites d'utilisation."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      {/* Toggle mensuel / annuel */}
      <div className="flex items-center gap-3">
        <a
          href="?billing=monthly"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${billing === "monthly" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Mensuel
        </a>
        <a
          href="?billing=yearly"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${billing === "yearly" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Annuel <span className="ml-1 text-xs text-emerald-600 font-semibold">−2 mois offerts</span>
        </a>
      </div>
      {usage.isOverLimit ? (
        <Notice
          type="error"
          message="Votre espace depasse les limites de l'offre actuelle apres changement d'abonnement. Les donnees restent consultables, mais les creations concernees sont bloquees tant que le depassement n'est pas reduit ou que l'offre n'est pas ajustee."
        />
      ) : null}

      {/* Current plan */}
      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-brand" />
              <p className="font-bold text-slate-900">Offre actuelle</p>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-950">{usage.plan}</p>
            <p className="mt-1 text-sm text-slate-500">
              Statut : {subscription?.status ?? "actif"}{" "}
              {subscription?.currentPeriodEnd
                ? `— Renouvellement : ${formatFrenchDate(subscription.currentPeriodEnd)}`
                : ""}
            </p>
          </div>
          <form action={createBillingPortalSessionAction}>
            <SubmitButton variant="secondary">Portail de facturation</SubmitButton>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Formations</p>
            <UsageBar used={usage.trainingPrograms} limit={usage.limits.trainingPrograms} />
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Preuves</p>
            <UsageBar used={usage.evidences} limit={usage.limits.evidences} />
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Documents (ce mois)</p>
            <UsageBar used={usage.generatedDocuments} limit={usage.limits.generatedDocumentsPerMonth} />
          </div>
        </div>
      </SectionCard>

      {/* Plan cards */}
      <section>
        <h2 className="mb-5 font-bold text-slate-900">Changer d&apos;offre</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map(({ id, name, monthly, yearly, description, highlight, target }) => {
            const limits = getPlanLimits(id);
            const isCurrent = usage.plan === id;
            const { price, period } = billing === "yearly" ? yearly : monthly;
            return (
              <article
                key={id}
                className={`relative flex flex-col rounded-xl p-5 ${
                  highlight ? "shadow-raised" : "bg-background shadow-card"
                }`}
                style={highlight ? { background: "#141413", border: "1px solid #2d2d2b" } : undefined}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow">
                      Recommandé
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${highlight ? "text-white/40" : "text-foreground-faint"}`}>
                      {target}
                    </p>
                    <h3 className={`mt-1 text-lg font-semibold ${highlight ? "text-white" : "text-foreground"}`}>
                      {name}
                    </h3>
                  </div>
                  {isCurrent ? <Badge tone="green">Actuel</Badge> : null}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold tabular-nums ${highlight ? "text-white" : "text-foreground"}`}>
                    {price}
                  </span>
                  <span className={`text-sm ${highlight ? "text-white/50" : "text-foreground-muted"}`}>{period}</span>
                </div>
                <p className={`mt-2 text-sm leading-6 ${highlight ? "text-white/60" : "text-foreground-muted"}`}>{description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {[
                    `Formations : ${limitLabel(limits.trainingPrograms)}`,
                    `Preuves : ${limitLabel(limits.evidences)}`,
                    `Documents/mois : ${limitLabel(limits.generatedDocumentsPerMonth)}`,
                    `Export audit : ${limits.fullAuditExport ? "Oui" : "Non"}`,
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className={highlight ? "text-white/70" : "text-foreground-muted"}>{item}</span>
                    </li>
                  ))}
                </ul>
                {id !== "FREE" ? (
                  <form action={createCheckoutSessionAction} className="mt-5">
                    <input type="hidden" name="plan" value={id} />
                    <input type="hidden" name="period" value={billing} />
                    <SubmitButton variant={highlight ? "secondary" : "primary"}>
                      {isCurrent ? "Réactiver via Stripe" : `Choisir ${name}`}
                    </SubmitButton>
                  </form>
                ) : (
                  <div className="mt-5">
                    {isCurrent ? (
                      <p className={`text-xs ${highlight ? "text-white/40" : "text-foreground-faint"}`}>
                        Votre offre actuelle
                      </p>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <strong>Développement :</strong> si les variables Stripe ne sont pas configurées, les boutons affichent un message
        d&apos;erreur explicite et aucune transaction n&apos;est simulée.
      </div>
    </main>
  );
}
