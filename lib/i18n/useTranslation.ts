import { useTranslation as useI18nTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supportedLanguages, SupportedLanguage } from "./config";
import { UseTranslationReturn, TranslationKey } from "./types";

export const useTranslation = (): UseTranslationReturn => {
  const { t: i18nT, i18n } = useI18nTranslation();
  const [language, setLanguage] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage
  );
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");

  useEffect(() => {
    const currentLang = i18n.language as SupportedLanguage;
    setLanguage(currentLang);

    const langConfig = supportedLanguages[currentLang];
    if (langConfig) {
      setDirection(langConfig.dir);

      // Update document direction
      document.documentElement.dir = langConfig.dir;
      document.documentElement.lang = currentLang;
    }
  }, [i18n.language]);

  const t = (key: TranslationKey | string): string => {
    // Handle namespaced keys (e.g., "common.loading" -> { ns: "common", key: "loading" })
    const [namespace, translationKey] = key.split(".");
    if (translationKey) {
      return i18nT(translationKey, { ns: namespace }) || key;
    }
    return i18nT(key) || key;
  };

  const changeLanguage = (newLanguage: SupportedLanguage): void => {
    i18n.changeLanguage(newLanguage);

    // Update localStorage
    localStorage.setItem("familyTreeLanguage", newLanguage);

    // Update document direction immediately
    const langConfig = supportedLanguages[newLanguage];
    if (langConfig) {
      document.documentElement.dir = langConfig.dir;
      document.documentElement.lang = newLanguage;
    }
  };

  return {
    t,
    language,
    direction,
    isRTL: direction === "rtl",
    changeLanguage,
  };
};

// Convenience hooks for specific namespaces
export const useCommonTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`common.${key}` as TranslationKey),
  };
};

export const useFormsTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`forms.${key}` as TranslationKey),
  };
};

export const useRelationshipsTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`relationships.${key}` as TranslationKey),
  };
};

export const useToolbarTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`toolbar.${key}` as TranslationKey),
  };
};

export const useMessagesTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`messages.${key}` as TranslationKey),
  };
};

export const useTimelineTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`timeline.${key}` as TranslationKey),
  };
};

export const useFooterTranslation = () => {
  const { t } = useTranslation();
  return {
    t: (key: string) => t(`footer.${key}` as TranslationKey),
  };
};

// Language context for providers
export const getLanguageFromStorage = (): SupportedLanguage => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("familyTreeLanguage");
    if (stored && stored in supportedLanguages) {
      return stored as SupportedLanguage;
    }
  }
  return "ar"; // Default to Arabic
};

export const getLanguageDirection = (
  language: SupportedLanguage
): "ltr" | "rtl" => {
  return supportedLanguages[language]?.dir || "rtl";
};
