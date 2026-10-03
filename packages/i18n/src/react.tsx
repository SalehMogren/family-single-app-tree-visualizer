"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@family/core";
import type { Dictionary } from "./dictionaries/ar";

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider = ({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) => (
  <I18nContext.Provider value={{ locale, dict, dir: locale === "ar" ? "rtl" : "ltr" }}>
    {children}
  </I18nContext.Provider>
);

export const useI18n = () => {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
};
