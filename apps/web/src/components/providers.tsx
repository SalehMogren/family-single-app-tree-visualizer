"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import type { Locale } from "@family/core";
import type { Dictionary } from "@family/i18n";
import { I18nProvider } from "@family/i18n/react";
import { TooltipProvider } from "@family/ui/components/tooltip";
import { Toaster } from "@family/ui/components/sonner";

export const Providers = ({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <I18nProvider locale={locale} dict={dict}>
      <TooltipProvider>
        {children}
        <Toaster
          position={locale === "ar" ? "bottom-left" : "bottom-right"}
          dir={locale === "ar" ? "rtl" : "ltr"}
        />
      </TooltipProvider>
    </I18nProvider>
  </ThemeProvider>
);
