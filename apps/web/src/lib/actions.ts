"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@family/i18n";

export const setLocaleAction = async (locale: "ar" | "en") => {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
};
