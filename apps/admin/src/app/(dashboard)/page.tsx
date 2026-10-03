import { getActivity } from "@family/data";
import { PageHeader } from "@/components/admin-shell";
import { Dashboard } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n";

const DashboardPage = async () => {
  const [{ dict }, activity] = await Promise.all([getI18n(), getActivity(8)]);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader title={dict.admin.dashboard.title} description={dict.admin.dashboard.welcome} />
      <Dashboard activity={activity} />
    </div>
  );
};

export default DashboardPage;
