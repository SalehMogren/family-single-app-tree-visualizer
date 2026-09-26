import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberDirectory } from "@/components/member-directory";
import { getPublicFamily, getSite } from "@/lib/data";
import { buildDirectory } from "@/lib/directory";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => {
  const { dict } = await getI18n();
  return { title: dict.directory.title };
};

const MembersPage = async ({ searchParams }: { searchParams: Promise<{ q?: string }> }) => {
  const [{ q }, { locale, dict }, data, site] = await Promise.all([
    searchParams,
    getI18n(),
    getPublicFamily(),
    getSite(),
  ]);
  if (!site.settings.features.directory) notFound();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2">
        <h1 className="font-display text-4xl font-bold">{dict.directory.title}</h1>
        <p className="text-muted-foreground">{dict.directory.subtitle}</p>
      </header>
      <MemberDirectory rows={buildDirectory(data, locale)} initialQuery={q ?? ""} />
    </main>
  );
};

export default MembersPage;
