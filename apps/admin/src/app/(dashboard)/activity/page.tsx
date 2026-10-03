import type { Metadata } from "next";
import { History } from "lucide-react";
import { getActivity } from "@family/data";
import { format, formatDate } from "@family/i18n";
import { Card, CardContent } from "@family/ui/components/card";
import { EmptyState } from "@family/ui/components/empty-state";
import { PageHeader } from "@/components/admin-shell";
import { getI18n } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getI18n()).dict.admin.activity.title,
});

const ActivityPage = async () => {
  const [{ dict, locale }, activity] = await Promise.all([getI18n(), getActivity(200)]);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader title={dict.admin.activity.title} description={dict.admin.activity.subtitle} />
      {activity.length === 0 ? (
        <EmptyState icon={<History />} title={dict.admin.dashboard.noActivity} />
      ) : (
        <Card className="py-2">
          <CardContent className="px-0">
            <ol className="divide-y">
              {activity.map((entry) => (
                <li
                  key={`${entry.at}-${entry.action}`}
                  className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <time
                    className="w-44 shrink-0 text-xs text-muted-foreground tabular-nums"
                    dateTime={entry.at}
                  >
                    {formatDate(locale, entry.at, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                  <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs">
                    {entry.action}
                  </code>
                  <span className="min-w-0 flex-1 truncate text-sm">{entry.summary}</span>
                  <span className="text-xs text-muted-foreground">
                    {dict.admin.activity.actor} {entry.actor}
                    {entry.revision
                      ? ` · ${format(dict.admin.activity.revision, { n: entry.revision })}`
                      : ""}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityPage;
