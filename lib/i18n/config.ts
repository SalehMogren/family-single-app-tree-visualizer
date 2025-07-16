import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import commonAr from "../../public/locales/ar/common.json";
import formsAr from "../../public/locales/ar/forms.json";
import relationshipsAr from "../../public/locales/ar/relationships.json";
import toolbarAr from "../../public/locales/ar/toolbar.json";
import messagesAr from "../../public/locales/ar/messages.json";
import familyTreeAr from "../../public/locales/ar/familyTree.json";

import commonEn from "../../public/locales/en/common.json";
import formsEn from "../../public/locales/en/forms.json";
import relationshipsEn from "../../public/locales/en/relationships.json";
import toolbarEn from "../../public/locales/en/toolbar.json";
import messagesEn from "../../public/locales/en/messages.json";
import familyTreeEn from "../../public/locales/en/familyTree.json";

// Supported languages
export const supportedLanguages = {
  ar: {
    name: "العربية",
    dir: "rtl",
    flag: "🇸🇦",
  },
  en: {
    name: "English",
    dir: "ltr",
    flag: "🇺🇸",
  },
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// Translation resources
const resources = {
  ar: {
    common: commonAr,
    forms: formsAr,
    relationships: relationshipsAr,
    toolbar: toolbarAr,
    messages: messagesAr,
    familyTree: familyTreeAr,
  },
  en: {
    common: commonEn,
    forms: formsEn,
    relationships: relationshipsEn,
    toolbar: toolbarEn,
    messages: messagesEn,
    familyTree: familyTreeEn,
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,

    // Default language
    lng: "ar",
    fallbackLng: "ar",

    // Default namespace
    defaultNS: "common",

    // Namespace configuration
    ns: [
      "common",
      "forms",
      "relationships",
      "toolbar",
      "messages",
      "familyTree",
    ],

    // Language detection configuration
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "familyTreeLanguage",
    },

    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
      skipOnVariables: false,
    },

    // React configuration
    react: {
      useSuspense: false,
    },

    // Development configuration
    debug: process.env.NODE_ENV === "development",

    // Key separator
    keySeparator: ".",

    // Namespace separator
    nsSeparator: false,
  });

export default i18n;
