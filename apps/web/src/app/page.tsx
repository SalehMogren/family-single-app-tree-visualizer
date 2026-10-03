import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarDays,
  Landmark,
  MapPin,
  Network,
  Users,
} from "lucide-react";
import { computeStats } from "@family/core";
import { format, formatNumber, formatPartialDate, pickLocalized } from "@family/i18n";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@family/ui/components/card";
import { SiteFooter } from "@/components/site-footer";
import { getPublicFamily, getSite } from "@/lib/data";
import { getI18n } from "@/lib/i18n";

const HomePage = async () => {
  const [{ locale, dict }, data, site] = await Promise.all([
    getI18n(),
    getPublicFamily(),
    getSite(),
  ]);
  const brief = site.brief[locale];
  const { features } = site.settings;
  const stats = computeStats(data);
  const yearsOfHistory = stats.earliestBirthYear
    ? new Date().getFullYear() - stats.earliestBirthYear
    : null;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const events = [...site.timeline].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const maxPerGeneration = Math.max(1, ...stats.perGeneration.map((g) => g.count));

  const statItems = [
    { value: stats.total, label: dict.home.members, icon: Users },
    { value: stats.generations, label: dict.home.generations, icon: Network },
    { value: stats.living, label: dict.home.living, icon: Landmark },
    ...(yearsOfHistory
      ? [{ value: yearsOfHistory, label: dict.home.yearsOfHistory, icon: CalendarDays }]
      : []),
  ];

  return (
    <>
      <main>
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] opacity-80"
          />
          <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 md:py-28">
            {brief.origin && (
              <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-sm">
                <MapPin /> {brief.origin}
              </Badge>
            )}
            <h1 className="font-display text-5xl leading-tight font-bold text-balance md:text-7xl">
              {brief.familyName}
            </h1>
            {brief.tagline && (
              <p className="mt-5 max-w-2xl text-lg text-balance text-muted-foreground md:text-xl">
                {brief.tagline}
              </p>
            )}
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/tree">
                  {dict.home.exploreTree}
                  <Arrow />
                </Link>
              </Button>
              {features.directory && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/members">{dict.home.browseMembers}</Link>
                </Button>
              )}
            </div>
            {features.stats && (
              <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                {statItems.map(({ value, label, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-xl border bg-card/80 p-4 shadow-xs backdrop-blur"
                  >
                    <Icon className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden />
                    <dt className="sr-only">{label}</dt>
                    <dd>
                      <span className="block text-3xl font-bold tabular-nums">
                        {formatNumber(locale, value)}
                      </span>
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {features.brief && (
          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <h2 className="font-display text-3xl font-bold">{dict.nav.about}</h2>
              <p className="text-lg leading-loose text-muted-foreground">{brief.description}</p>
              {brief.notableMembers && (
                <div className="rounded-xl border-s-4 border-primary bg-muted/50 p-5">
                  <p className="mb-1 font-semibold">{dict.home.notable}</p>
                  <p className="text-muted-foreground">{brief.notableMembers}</p>
                </div>
              )}
            </div>
            <div className="grid gap-4">
              {[
                { title: dict.home.origin, body: brief.origin },
                { title: dict.home.established, body: brief.established },
                {
                  title: dict.home.geography,
                  body: [brief.geography.mainRegion, brief.geography.description]
                    .filter(Boolean)
                    .join(" — "),
                },
              ]
                .filter((item) => item.body)
                .map((item) => (
                  <Card key={item.title} className="gap-2 py-5">
                    <CardHeader className="px-5">
                      <CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 font-medium">{item.body}</CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {features.brief && brief.achievements.length > 0 && (
          <section className="border-y bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
              <h2 className="mb-8 font-display text-3xl font-bold">{dict.home.achievements}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {brief.achievements.map((achievement) => (
                  <li
                    key={achievement}
                    className="flex gap-3 rounded-xl border bg-card p-5 shadow-xs"
                  >
                    <Award className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span className="leading-relaxed">{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {features.stats && stats.perGeneration.length > 0 && (
          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{dict.home.generationsChart}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {stats.perGeneration.map(({ generation, count }) => (
                    <li
                      key={generation}
                      className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {format(dict.home.generationN, { n: generation })}
                      </span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(count / maxPerGeneration) * 100}%` }}
                        />
                      </span>
                      <span className="text-end font-medium tabular-nums">
                        {formatNumber(locale, count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{dict.home.commonNames}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {stats.topNames.map(({ name, count }) => (
                  <Badge key={name} variant="secondary" className="px-3 py-1.5 text-sm">
                    {name}
                    <span className="text-muted-foreground tabular-nums">×{count}</span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {features.timeline && events.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-bold">{dict.home.latestEvents}</h2>
              <Button variant="link" asChild>
                <Link href="/timeline">
                  {dict.common.viewAll}
                  <Arrow />
                </Link>
              </Button>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {events.map((event) => (
                <li key={event.id} className="rounded-xl border bg-card p-5 shadow-xs">
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatPartialDate(locale, event.date)}
                  </p>
                  <p className="mt-2 font-semibold">{pickLocalized(event.title, locale)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {pickLocalized(event.description, locale)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
      <SiteFooter site={site} familyName={brief.familyName} dict={dict} />
    </>
  );
};

export default HomePage;
