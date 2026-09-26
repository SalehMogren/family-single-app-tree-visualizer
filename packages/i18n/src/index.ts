import type { Locale } from "@family/core";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

export type { Locale };
export type { Dictionary } from "./dictionaries/ar";

export const LOCALES: Locale[] = ["ar", "en"];
export const LOCALE_COOKIE = "locale";
export const dictionaries = { ar, en } as const;

export const isLocale = (value: unknown): value is Locale => value === "ar" || value === "en";
export const getDictionary = (locale: Locale) => dictionaries[locale];
export const getDirection = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** Replace `{name}` placeholders. */
export const format = (template: string, params: Record<string, string | number> = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));

/** Look up a nested dictionary entry by dot path (for dynamic codes such as issue keys). */
export const lookup = (dict: object, path: string, fallback = path): string => {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, dict);
  return typeof value === "string" ? value : fallback;
};

export const formatNumber = (locale: Locale, value: number) =>
  new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US").format(value);

export const formatDate = (locale: Locale, iso: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    dateStyle: "medium",
    ...options,
  }).format(date);
};

/** Render a partial date string (YYYY, YYYY-MM, YYYY-MM-DD) for the given locale. */
export const formatPartialDate = (locale: Locale, value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  if (!m) return String(y);
  const date = new Date(Date.UTC(y, m - 1, d || 1));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    year: "numeric",
    month: "long",
    ...(d ? { day: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date);
};

export const pickLocalized = (value: { ar: string; en: string }, locale: Locale) =>
  value[locale]?.trim() ? value[locale] : value[locale === "ar" ? "en" : "ar"];
