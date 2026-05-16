import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Badge ─── */
type BadgeTone = "slate" | "green" | "amber" | "red" | "blue" | "violet";

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    slate: "border-border bg-surface-subtle text-foreground-muted",
    green: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
    amber: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
    red: "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]",
    blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ─── Buttons ─── */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover",
    secondary: "border border-border bg-surface text-foreground hover:bg-surface-subtle",
    accent: "bg-accent text-white hover:bg-accent-hover",
  };
  const sizes = {
    sm: "min-h-8 px-3 py-1.5 text-xs",
    md: "min-h-9 px-4 py-2 text-sm",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
        variants[variant],
        sizes[size],
      )}
    >
      {children}
    </Link>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "accent";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover",
    secondary: "border border-border bg-surface text-foreground hover:bg-surface-subtle",
    danger: "bg-[#991b1b] text-white hover:bg-[#7f1d1d]",
    accent: "bg-accent text-white hover:bg-accent-hover",
  };
  const sizes = {
    sm: "min-h-8 px-3 py-1.5 text-xs",
    md: "min-h-9 px-4 py-2 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
        variants[variant],
        sizes[size],
      )}
      type="submit"
    >
      {children}
    </button>
  );
}

/* ─── Form ─── */
export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>
        {label}
        {required ? <span className="ml-1 text-[#991b1b]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs font-normal text-foreground-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/8 placeholder:text-foreground-faint";

export const textareaClass =
  "min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/8 placeholder:text-foreground-faint resize-y";

/* ─── Notice ─── */
export function Notice({
  message,
  type = "info",
}: {
  message?: string | string[];
  type?: "info" | "success" | "error";
}) {
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  const tones = {
    info: "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]",
    success: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
    error: "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]",
  };
  return <p className={cn("rounded-lg border px-4 py-3 text-sm leading-6", tones[type])}>{text}</p>;
}

/* ─── PageHeader ─── */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-foreground-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ─── StatCard ─── */
type StatCardTone = "default" | "green" | "amber" | "red" | "blue";

const statValueTones: Record<StatCardTone, string> = {
  default: "text-foreground",
  green: "text-accent",
  amber: "text-[#92400e]",
  red: "text-[#991b1b]",
  blue: "text-[#1e40af]",
};

export function StatCard({
  label,
  value,
  detail,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  tone?: StatCardTone;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-faint">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", statValueTones[tone])}>{value}</p>
      {detail ? <p className="mt-1.5 text-xs text-foreground-muted">{detail}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl bg-surface p-5 shadow-card transition hover:shadow-raised">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      {content}
    </div>
  );
}

/* ─── ProgressBar ─── */
export function ProgressBar({ value, tone }: { value: number; tone?: "green" | "amber" | "red" | "blue" | "auto" }) {
  const safeValue = Math.max(0, Math.min(100, value));

  let colorClass = "bg-[#1e40af]";
  const resolvedTone = tone ?? "auto";
  if (resolvedTone === "auto") {
    if (safeValue >= 85) colorClass = "bg-accent";
    else if (safeValue >= 60) colorClass = "bg-[#d97706]";
    else colorClass = "bg-[#dc2626]";
  } else {
    const toneColors: Record<string, string> = {
      green: "bg-accent",
      amber: "bg-[#d97706]",
      red: "bg-[#dc2626]",
      blue: "bg-[#1e40af]",
    };
    colorClass = toneColors[resolvedTone] ?? "bg-[#1e40af]";
  }

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div className={cn("h-1.5 rounded-full transition-all", colorClass)} style={{ width: `${safeValue}%` }} />
    </div>
  );
}

/* ─── EmptyState ─── */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      {icon ? <div className="mb-4 text-foreground-faint">{icon}</div> : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-foreground-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* ─── SectionCard ─── */
export function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-surface p-5 shadow-card", className)}>
      {children}
    </div>
  );
}

/* ─── Disclaimer ─── */
export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm leading-6 text-[#92400e]">
      {children}
    </div>
  );
}
