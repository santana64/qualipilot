"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  limits: string[];
  cta: string;
  highlight: boolean;
  target: string;
};

const monthlyPrices: Record<string, number> = {
  FREE: 0,
  STARTER: 49,
  PRO: 89,
  CABINET: 149,
};

export function LandingPricing({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <div className="mt-6 inline-flex rounded-lg border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${annual ? "text-foreground-muted" : "bg-brand text-white"}`}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${annual ? "bg-brand text-white" : "text-foreground-muted"}`}
        >
          Annuel - 2 mois offerts
        </button>
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-4">
        {plans.map(({ id, name, price, period, description, limits, cta, highlight, target }) => {
          const monthly = monthlyPrices[id] ?? 0;
          const displayPrice = annual && monthly > 0 ? `${monthly * 10} €` : price;
          const displayPeriod = annual && monthly > 0 ? "/ an" : period;
          return (
            <article
              key={id}
              className={`relative flex flex-col rounded-xl p-6 ${
                highlight ? "shadow-raised" : "border border-border bg-background shadow-card"
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
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${highlight ? "text-white/40" : "text-foreground-faint"}`}>
                  {target}
                </p>
                <h3 className={`mt-1.5 text-lg font-semibold ${highlight ? "text-white" : "text-foreground"}`}>{name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold tabular-nums ${highlight ? "text-white" : "text-foreground"}`}>{displayPrice}</span>
                  <span className={`text-sm ${highlight ? "text-white/50" : "text-foreground-muted"}`}>{displayPeriod}</span>
                </div>
                {annual && monthly > 0 ? (
                  <p className={`mt-1 text-xs ${highlight ? "text-white/45" : "text-foreground-faint"}`}>
                    Equivalent {monthly} €/mois, facture annuellement.
                  </p>
                ) : null}
                <p className={`mt-2 text-sm leading-6 ${highlight ? "text-white/60" : "text-foreground-muted"}`}>{description}</p>
              </div>
              <ul className="mt-5 flex-1 space-y-2">
                {limits.map((limit) => (
                  <li key={limit} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    <span className={highlight ? "text-white/70" : "text-foreground-muted"}>{limit}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  highlight ? "bg-white text-foreground hover:bg-surface-subtle" : "bg-brand text-white hover:bg-brand-hover"
                }`}
              >
                {cta}
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
