import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import { pickLocalized } from "@family/i18n";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { getI18n } from "@/lib/i18n";
import { getSite } from "@/lib/data";

export const generateMetadata = async (): Promise<Metadata> => {
  const [{ locale, dict }, site] = await Promise.all([getI18n(), getSite()]);
  const brief = site.brief[locale];
  const familyName =
    brief.familyName ||
    pickLocalized({ ar: site.brief.ar.familyName, en: site.brief.en.familyName }, locale);
  return {
    title: { default: `${familyName} · ${dict.common.appName}`, template: `%s · ${familyName}` },
    description: brief.tagline || brief.description,
    icons: { icon: "/icon.svg" },
  };
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141b24" },
  ],
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const [{ locale, dict, dir }, site] = await Promise.all([getI18n(), getSite()]);
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-clip font-sans">
        <Providers locale={locale} dict={dict}>
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
          >
            {dict.common.skipToContent}
          </a>
          <SiteHeader
            familyName={site.brief[locale].familyName}
            features={site.settings.features}
          />
          <div id="main">{children}</div>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
