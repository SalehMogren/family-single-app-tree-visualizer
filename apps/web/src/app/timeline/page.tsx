import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Baby,
  Briefcase,
  CalendarHeart,
  GraduationCap,
  Heart,
  Home,
  Plane,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { TimelineEventType } from "@family/core";
import { formatPartialDate, pickLocalized } from "@family/i18n";
import { Badge } from "@family/ui/components/badge";
import { EmptyState } from "@family/ui/components/empty-state";
import { cn } from "@family/ui/lib/utils";
import { SiteFooter } from "@/components/site-footer";
import { getPublicFamily, getSite } from "@/lib/data";
import { getI18n } from "@/lib/i18n";

const ICONS: Record<TimelineEventType, LucideIcon> = {
  family: Home,
  birth: Baby,
  marriage: Heart,
  death: Star,
  migration: Plane,
  business: Briefcase,
  education: GraduationCap,
  reunion: Users,
  other: CalendarHeart,
};

export const generateMetadata = async (): Promise<Metadata> => {
  const { dict } = await getI18n();
  return { title: dict.timeline.title };
};

const TimelinePage = async ({ searchParams }: { searchParams: Promise<{ type?: string }> }) => {
  const [{ type }, site, data, { locale, dict }] = await Promise.all([
    searchParams,
    getSite(),
    getPublicFamily(),
    getI18n(),
  ]);
  if (!site.settings.features.timeline) notFound();
  const types = [...new Set(site.timeline.map((e) => e.type))];
  const events = [...site.timeline]
    .filter((e) => !type || e.type === type)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-8 space-y-2">
          <h1 className="font-display text-4xl font-bold">{dict.timeline.title}</h1>
          <p className="text-muted-foreground">{dict.timeline.subtitle}</p>
        </header>
        {types.length > 1 && (
          <nav className="mb-10 flex flex-wrap gap-2" aria-label={dict.timeline.title}>
            <Badge asChild variant={!type ? "default" : "outline"} className="px-3 py-1 text-sm">
              <Link href="/timeline">{dict.common.all}</Link>
            </Badge>
            {types.map((t) => (
              <Badge
                key={t}
                asChild
                variant={type === t ? "default" : "outline"}
                className="px-3 py-1 text-sm"
              >
                <Link href={`/timeline?type=${t}`}>{dict.timeline.types[t]}</Link>
              </Badge>
            ))}
          </nav>
        )}
        {events.length === 0 ? (
          <EmptyState icon={<CalendarHeart />} title={dict.timeline.empty} />
        ) : (
          <ol className="relative space-y-8 before:absolute before:inset-y-2 before:start-5 before:w-px before:bg-border">
            {events.map((event) => {
              const Icon = ICONS[event.type];
              const people = event.memberIds.map((id) => data.members[id]).filter(Boolean);
              return (
                <li key={event.id} className="relative flex gap-5">
                  <span className="z-10 grid size-10 shrink-0 place-items-center rounded-full border bg-card text-primary shadow-xs">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <article className="flex-1 rounded-xl border bg-card p-5 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <time className="text-sm font-semibold tabular-nums" dateTime={event.date}>
                        {formatPartialDate(locale, event.date)}
                      </time>
                      <Badge variant="secondary">{dict.timeline.types[event.type]}</Badge>
                    </div>
                    <h2 className="mt-2 text-lg font-bold">{pickLocalized(event.title, locale)}</h2>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {pickLocalized(event.description, locale)}
                    </p>
                    {people.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{dict.timeline.participants}:</span>
                        {people.map((m) => (
                          <Link
                            key={m.id}
                            href={
                              site.settings.features.directory
                                ? `/members/${m.id}`
                                : `/tree?focus=${m.id}`
                            }
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 hover:bg-accent",
                              m.gender === "male" ? "border-male/40" : "border-female/40",
                            )}
                          >
                            {m.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </main>
      <SiteFooter site={site} familyName={site.brief[locale].familyName} dict={dict} />
    </>
  );
};

export default TimelinePage;
