import type { Metadata } from "next";
import { listBackups } from "@family/data";
import { PageHeader } from "@/components/admin-shell";
import { DataManager } from "@/components/data-manager";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({ title: (await getI18n()).dict.admin.data.title });

const DataPage = async () => {
  const [{ dict }, backups] = await Promise.all([getI18n(), listBackups()]);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader title={dict.admin.data.title} description={dict.admin.data.subtitle} />
      <DataManager backups={backups} />
    </div>
  );
};

export default DataPage;
