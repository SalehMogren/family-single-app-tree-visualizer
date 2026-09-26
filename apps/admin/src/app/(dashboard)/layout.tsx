import type { ReactNode } from "react";
import { getFamilyData, getSiteContent } from "@family/data";
import { AdminShell } from "@/components/admin-shell";
import { FamilyStoreProvider } from "@/lib/family-store";
import { getI18n } from "@/lib/i18n";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const [data, site, { locale }] = await Promise.all([
    getFamilyData(),
    getSiteContent(),
    getI18n(),
  ]);
  return (
    <FamilyStoreProvider initial={data}>
      <AdminShell
        familyName={site.brief[locale].familyName}
        webUrl={process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}
      >
        {children}
      </AdminShell>
    </FamilyStoreProvider>
  );
};

export default DashboardLayout;
