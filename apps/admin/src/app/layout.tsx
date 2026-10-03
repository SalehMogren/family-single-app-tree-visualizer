import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => {
  const { dict } = await getI18n();
  return {
    title: {
      default: `${dict.common.adminName} · ${dict.common.appName}`,
      template: `%s · ${dict.common.adminName}`,
    },
    robots: { index: false, follow: false },
    icons: { icon: "/icon.svg" },
  };
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const { locale, dict, dir } = await getI18n();
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-clip font-sans">
        <Providers locale={locale} dict={dict}>
          {children}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
