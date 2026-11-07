import type { Locale } from "@/lib/domain";

export function formatMoney(amount: number, currency: string, locale: Locale) {
  const safeCurrency = ["ILS", "USD", "EUR"].includes(currency) ? currency : "ILS";
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(amount: number, locale: Locale, digits = 0) {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPercent(ratio: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(ratio) ? ratio : 0);
}

export function formatWhen(iso: string, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}
