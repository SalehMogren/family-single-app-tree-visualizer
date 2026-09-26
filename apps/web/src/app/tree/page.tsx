import type { Metadata } from "next";
import { TreeExplorer } from "@/components/tree-explorer";
import { getPublicFamily, getSite } from "@/lib/data";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => {
  const { dict } = await getI18n();
  return { title: dict.tree.title };
};

const TreePage = async ({ searchParams }: { searchParams: Promise<{ focus?: string }> }) => {
  const [{ focus }, data, site, { locale }] = await Promise.all([
    searchParams,
    getPublicFamily(),
    getSite(),
    getI18n(),
  ]);
  return (
    <main className="h-[calc(100dvh-4rem)]">
      <TreeExplorer
        data={data}
        settings={site.settings}
        initialFocusId={focus ?? null}
        fileName={site.brief[locale].familyName.replace(/\s+/g, "-") || "family-tree"}
      />
    </main>
  );
};

export default TreePage;
