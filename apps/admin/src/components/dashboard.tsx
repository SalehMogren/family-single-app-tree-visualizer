"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Network,
  UserPlus,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { analyzeHealth, computeStats, linkParent, type HealthIssue } from "@family/core";
import type { ActivityEntry } from "@family/data";
import { format, formatDate, formatNumber, lookup } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@family/ui/components/card";
import { EmptyState } from "@family/ui/components/empty-state";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";

const LEVEL_ICON = { error: XCircle, warning: AlertTriangle, info: Info } as const;
const LEVEL_CLASS = {
  error: "text-destructive",
  warning: "text-warning",
  info: "text-ring",
} as const;

export const Dashboard = ({ activity }: { activity: ActivityEntry[] }) => {
  const { dict, locale } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const stats = useMemo(() => computeStats(data), [data]);
  const health = useMemo(() => analyzeHealth(data), [data]);

  const handleFix = (issue: HealthIssue) => {
    if (issue.fix?.kind !== "linkSpouseAsParent") return;
    const { parentId, childId } = issue.fix;
    mutate(
      (d) => linkParent(d, parentId, childId),
      { action: "health.fix", summary: issue.code },
      dict.health.fixed,
    );
  };

  const names = (issue: HealthIssue) =>
    issue.memberIds
      .map((id) => data.members[id]?.name)
      .filter(Boolean)
      .join("، ");

  const tiles = [
    {
      label: dict.home.members,
      value: stats.total,
      hint: `${formatNumber(locale, stats.male)} ${dict.common.male} · ${formatNumber(locale, stats.female)} ${dict.common.female}`,
    },
    {
      label: dict.home.generations,
      value: stats.generations,
      hint: `${formatNumber(locale, stats.bloodLine)} / ${formatNumber(locale, stats.inLaws)} ${dict.admin.dashboard.inLaws}`,
    },
    {
      label: dict.home.living,
      value: stats.living,
      hint: `${formatNumber(locale, stats.deceased)} ${dict.common.deceased}`,
    },
    {
      label: dict.health.title,
      value: health.filter((h) => h.level !== "info").length,
      hint: `${formatNumber(locale, stats.disconnected)} ${dict.admin.dashboard.disconnected}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="gap-1 py-5">
            <CardHeader className="px-5">
              <CardDescription>{tile.label}</CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <p className="text-3xl font-bold tabular-nums">{formatNumber(locale, tile.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/editor">
            <Network /> {dict.admin.dashboard.openEditor}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/members">
            <UserPlus /> {dict.admin.dashboard.addMember}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{dict.health.title}</CardTitle>
            <CardDescription>{dict.health.description}</CardDescription>
            <CardAction>
              <Badge
                variant={health.some((h) => h.level === "error") ? "destructive" : "secondary"}
                className="tabular-nums"
              >
                {health.length}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {health.length === 0 ? (
              <EmptyState icon={<CheckCircle2 />} title={dict.health.healthy} />
            ) : (
              <ul className="max-h-[28rem] divide-y overflow-y-auto">
                {health.map((issue) => {
                  const Icon = LEVEL_ICON[issue.level];
                  return (
                    <li key={issue.id} className="flex items-start gap-3 py-3">
                      <Icon
                        className={`mt-0.5 size-4 shrink-0 ${LEVEL_CLASS[issue.level]}`}
                        aria-label={dict.health.levels[issue.level]}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {format(lookup(dict.health, issue.code), issue.params)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{names(issue)}</p>
                      </div>
                      {issue.fix ? (
                        <Button size="sm" variant="outline" onClick={() => handleFix(issue)}>
                          <Wrench /> {dict.health.fix}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/editor?focus=${issue.memberIds[0]}`}>
                            {dict.common.edit}
                          </Link>
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.admin.dashboard.recentActivity}</CardTitle>
            <CardAction>
              <Button variant="link" size="sm" asChild>
                <Link href="/activity">{dict.common.viewAll}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState icon={<Users />} title={dict.admin.dashboard.noActivity} />
            ) : (
              <ol className="space-y-3">
                {activity.map((entry) => (
                  <li key={`${entry.at}-${entry.action}`} className="text-sm">
                    <p className="font-medium">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.action}</code>{" "}
                      {entry.summary}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(locale, entry.at, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
