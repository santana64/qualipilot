import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatFrenchDate(date: Date | string | null | undefined): string {
  if (!date) return "Non renseigné";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date invalide";
  return format(parsed, "d MMMM yyyy", { locale: fr });
}

export function formatShortFrenchDate(date: Date | string | null | undefined): string {
  if (!date) return "Non renseigné";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date invalide";
  return format(parsed, "dd/MM/yyyy", { locale: fr });
}

export function formatPercent(number: number): string {
  return `${Math.round(number)} %`;
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "Non renseigné";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
