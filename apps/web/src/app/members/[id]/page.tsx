import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Home, MapPin, Network, Sparkles } from "lucide-react";
import {
  formatLineage,
  getChildIds,
  getDescendantIds,
  getGenerations,
  getLineage,
  getParentIds,
  getSiblingIds,
  getSpouseIds,
  isLiving,
  resolveRootId,
  type FamilyData,
  type Member,
  initials,
} from "@family/core";
import {
  format,
  formatNumber,
  pickLocalized,
  formatPartialDate,
  type Dictionary,
} from "@family/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@family/ui/components/avatar";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@family/ui/components/card";
import { cn } from "@family/ui/lib/utils";
import { getPublicFamily, getSite } from "@/lib/data";
import { deceasedLabel, lifeSpan } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

type Params = { params: Promise<{ id: string }> };

export const generateMetadata = async ({ params }: Params): Promise<Metadata> => {
  const [{ id }, data, { locale }] = await Promise.all([params, getPublicFamily(), getI18n()]);
  const member = data.members[id];
  if (!member) return {};
  return { title: formatLineage(getLineage(data, id), locale, 2) };
};

const PersonLink = ({
  member,
  data,
  dict,
}: {
  member: Member;
  data: FamilyData;
  dict: Dictionary;
}) => (
  <Link
    href={`/members/${member.id}`}
    className="flex items-center gap-3 rounded-lg border bg-background p-2.5 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
  >
    <Avatar
      className={cn(
        "size-9 border-2",
        member.gender === "male" ? "border-male/60" : "border-female/60",
      )}
    >
      {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
      <AvatarFallback className="text-sm font-semibold">{initials(member.name)}</AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{member.name}</p>
      <p className="truncate text-xs text-muted-foreground tabular-nums">
        {lifeSpan(member, dict) ||
          (getChildIds(data, member.id).length
            ? format(dict.tree.childrenCount, { count: getChildIds(data, member.id).length })
            : "")}
      </p>
    </div>
  </Link>
);

const RelativesCard = ({
  title,
  ids,
  data,
  dict,
}: {
  title: string;
  ids: string[];
  data: FamilyData;
  dict: Dictionary;
}) => (
  <Card className="gap-4">
    <CardHeader>
      <CardTitle className="flex items-center justify-between text-base">
        {title}
        <Badge variant="secondary" className="tabular-nums">
          {ids.length}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {ids.length ? (
        <div className="grid gap-2">
          {ids.map(
            (id) =>
              data.members[id] && (
                <PersonLink key={id} member={data.members[id]} data={data} dict={dict} />
              ),
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{dict.member.noRelatives}</p>
      )}
    </CardContent>
  </Card>
);

const MemberPage = async ({ params }: Params) => {
  const [{ id }, data, site, { locale, dict }] = await Promise.all([
    params,
    getPublicFamily(),
    getSite(),
    getI18n(),
  ]);
  if (!site.settings.features.directory) notFound();
  const member = data.members[id];
  if (!member) notFound();

  const chain = getLineage(data, id);
  const generation = getGenerations(data, resolveRootId(data)).get(id);
  const living = isLiving(member);
  const span = lifeSpan(member, dict);
  const descendants = getDescendantIds(data, id).size;
  const events = site.timeline.filter((e) => e.memberIds.includes(id));
  const details = [
    { icon: Briefcase, label: dict.member.occupation, value: member.occupation },
    { icon: MapPin, label: dict.member.birthplace, value: member.birthplace },
    { icon: Home, label: dict.member.residence, value: member.residence },
    { icon: Sparkles, label: dict.member.nickname, value: member.nickname },
  ].filter((d) => d.value);
  const hiddenForPrivacy = site.settings.privacy.hideLivingDetails && living;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 h-1.5",
            member.gender === "male" ? "bg-male" : "bg-female",
          )}
        />
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar
            className={cn(
              "size-24 border-4 text-3xl",
              member.gender === "male" ? "border-male/40" : "border-female/40",
            )}
          >
            {member.photoUrl && <AvatarImage src={member.photoUrl} alt={member.name} />}
            <AvatarFallback className="font-bold">{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-display text-4xl font-bold">{member.name}</h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {formatLineage(chain, locale, 8)}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {generation && (
                <Badge variant="secondary">
                  {format(dict.member.generation, { n: generation })}
                </Badge>
              )}
              {span && (
                <Badge variant="outline" className="tabular-nums">
                  {span}
                </Badge>
              )}
              {!living && <Badge variant="secondary">{deceasedLabel(member, dict)}</Badge>}
              <Badge variant="outline">
                {member.gender === "male" ? dict.common.male : dict.common.female}
              </Badge>
              {descendants > 0 && (
                <Badge variant="outline">
                  {format(dict.member.descendantsCount, {
                    count: formatNumber(locale, descendants),
                  })}
                </Badge>
              )}
            </div>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0">
            <Link href={`/tree?focus=${id}`}>
              <Network />
              {dict.tree.showInTree}
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {(member.bio || details.length > 0 || hiddenForPrivacy) && (
            <Card>
              <CardHeader>
                <CardTitle>{dict.member.details}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {hiddenForPrivacy && (
                  <p className="text-sm text-muted-foreground">{dict.member.privateDetails}</p>
                )}
                {details.length > 0 && (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {details.map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex gap-3">
                        <Icon
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <div>
                          <dt className="text-xs text-muted-foreground">{label}</dt>
                          <dd className="font-medium">{value}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                )}
                {member.bio && <p className="leading-loose whitespace-pre-line">{member.bio}</p>}
              </CardContent>
            </Card>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <RelativesCard
              title={dict.member.children}
              ids={getChildIds(data, id)}
              data={data}
              dict={dict}
            />
            <RelativesCard
              title={dict.member.siblings}
              ids={getSiblingIds(data, id)}
              data={data}
              dict={dict}
            />
          </div>
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dict.timeline.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 border-s ps-5">
                  {events.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-card" />
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatPartialDate(locale, event.date)}
                      </p>
                      <p className="font-medium">{pickLocalized(event.title, locale)}</p>
                      <p className="text-sm text-muted-foreground">
                        {pickLocalized(event.description, locale)}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <RelativesCard
            title={dict.member.parents}
            ids={getParentIds(data, id)}
            data={data}
            dict={dict}
          />
          <RelativesCard
            title={dict.member.spouses}
            ids={getSpouseIds(data, id)}
            data={data}
            dict={dict}
          />
        </div>
      </div>
    </main>
  );
};

export default MemberPage;
