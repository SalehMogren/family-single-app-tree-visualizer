import type { Metadata } from "next";
import { PageHeader } from "@/components/admin-shell";
import { MembersTable } from "@/components/members-table";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getI18n()).dict.admin.members.title,
});

const MembersPage = async () => {
  const { dict } = await getI18n();
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader title={dict.admin.members.title} description={dict.admin.members.subtitle} />
      <MembersTable />
    </div>
  );
};

export default MembersPage;
