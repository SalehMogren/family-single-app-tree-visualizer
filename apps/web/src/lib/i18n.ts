import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getDictionary, isLocale, LOCALE_COOKIE, type Locale } from "@family/i18n";
import { getSiteContent } from "@family/data";

export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;
  return (await getSiteContent()).settings.defaultLocale;
});

export const getI18n = cache(async () => {
  const locale = await getLocale();
  return {
    locale,
    dict: getDictionary(locale),
    dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
  };
});
