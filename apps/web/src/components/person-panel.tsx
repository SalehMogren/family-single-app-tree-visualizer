"use client";

import Link from "next/link";
import { ExternalLink, GitBranch, Network, X } from "lucide-react";
import {
  formatLineage,
  getChildIds,
  getLineage,
  getParentIds,
  getSiblingIds,
  getSpouseIds,
  isLiving,
  type FamilyData,
  initials,
} from "@family/core";
import { useI18n } from "@family/i18n/react";
import { Avatar, AvatarFallback, AvatarImage } from "@family/ui/components/avatar";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import { Separator } from "@family/ui/components/separator";
import { Switch } from "@family/ui/components/switch";
import { Label } from "@family/ui/components/label";
import { cn } from "@family/ui/lib/utils";
import { deceasedLabel, lifeSpan } from "@/lib/format";

const RelativeChips = ({
  title,
  ids,
  data,
  onPick,
}: {
  title: string;
  ids: string[];
  data: FamilyData;
  onPick: (id: string) => void;
}) => {
  if (!ids.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => {
          const m = data.members[id];
          if (!m) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  m.gender === "male" ? "bg-male" : "bg-female",
                )}
              />
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PersonPanel = ({
  data,
  id,
  onClose,
  onPick,
  highlightLineage,
  onHighlightLineageChange,
  showProfileLink,
  onFocusView,
  className,
}: {
  data: FamilyData;
  id: string;
  onClose: () => void;
  onPick: (id: string) => void;
  highlightLineage: boolean;
  onHighlightLineageChange: (value: boolean) => void;
  showProfileLink: boolean;
  /** Show only this person's branch (offered when they have children). */
  onFocusView?: (id: string) => void;
  className?: string;
}) => {
  const { dict, locale } = useI18n();
  const member = data.members[id];
  if (!member) return null;
  const lineage = formatLineage(getLineage(data, id), locale, 5);
  const span = lifeSpan(member, dict);
  const living = isLiving(member);

  return (
    <aside
      aria-label={member.name}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card/95 p-5 shadow-lg backdrop-blur",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          className="size-14 border-2"
          style={{ borderColor: member.gender === "male" ? "var(--male)" : "var(--female)" }}
        >
          {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
          <AvatarFallback className="text-lg font-semibold">{initials(member.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{member.name}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{lineage}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {span && (
              <Badge variant="outline" className="tabular-nums">
                {span}
              </Badge>
            )}
            {!living && <Badge variant="secondary">{deceasedLabel(member, dict)}</Badge>}
            {member.occupation && <Badge variant="secondary">{member.occupation}</Badge>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={dict.common.close}
          className="-me-2 -mt-2"
        >
          <X />
        </Button>
      </div>
      {member.bio && <p className="line-clamp-4 text-sm leading-relaxed">{member.bio}</p>}
      <Separator />
      <div className="max-h-[40dvh] space-y-3 overflow-y-auto">
        <RelativeChips
          title={dict.member.parents}
          ids={getParentIds(data, id)}
          data={data}
          onPick={onPick}
        />
        <RelativeChips
          title={dict.member.spouses}
          ids={getSpouseIds(data, id)}
          data={data}
          onPick={onPick}
        />
        <RelativeChips
          title={dict.member.children}
          ids={getChildIds(data, id)}
          data={data}
          onPick={onPick}
        />
        <RelativeChips
          title={dict.member.siblings}
          ids={getSiblingIds(data, id)}
          data={data}
          onPick={onPick}
        />
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="lineage-toggle" className="gap-2 font-normal">
          <GitBranch className="size-4 text-muted-foreground" />
          {dict.tree.focusLineage}
        </Label>
        <Switch
          id="lineage-toggle"
          checked={highlightLineage}
          onCheckedChange={onHighlightLineageChange}
        />
      </div>
      {onFocusView && getChildIds(data, id).length > 0 && (
        <Button onClick={() => onFocusView(id)} title={dict.tree.focusViewHint}>
          <Network />
          {dict.tree.focusView}
        </Button>
      )}
      {showProfileLink && (
        <Button asChild variant="secondary">
          <Link href={`/members/${id}`}>
            <ExternalLink />
            {dict.tree.openProfile}
          </Link>
        </Button>
      )}
    </aside>
  );
};
