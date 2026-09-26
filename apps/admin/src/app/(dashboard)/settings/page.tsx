import type { Metadata } from "next";
import { getSiteContent } from "@family/data";
import { PageHeader } from "@/components/admin-shell";
import { SettingsForm } from "@/components/settings-form";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getI18n()).dict.admin.settings.title,
});

const SettingsPage = async () => {
  const [{ dict }, site] = await Promise.all([getI18n(), getSiteContent()]);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader title={dict.admin.settings.title} description={dict.admin.settings.subtitle} />
      <SettingsForm key={site.updatedAt} initial={site} />
    </div>
  );
};

export default SettingsPage;
