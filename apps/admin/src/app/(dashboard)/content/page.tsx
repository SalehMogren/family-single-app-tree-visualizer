import type { Metadata } from "next";
import { getSiteContent } from "@family/data";
import { PageHeader } from "@/components/admin-shell";
import { ContentEditor } from "@/components/content-editor";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getI18n()).dict.admin.content.title,
});

const ContentPage = async () => {
  const [{ dict }, site] = await Promise.all([getI18n(), getSiteContent()]);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader title={dict.admin.content.title} description={dict.admin.content.subtitle} />
      <ContentEditor key={site.updatedAt} initial={site} />
    </div>
  );
};

export default ContentPage;
