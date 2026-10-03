"use client";

import Link from "next/link";
import {
  Crown,
  Heart,
  Network,
  Trash2,
  UserPlus,
  Users,
  Baby,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import {
  findRelationship,
  formatLineage,
  getChildIds,
  getLineage,
  getParentIds,
  getSiblingIds,
  getSpouseIds,
  initials,
  resolveRootId,
  setRoot,
  unlink,
  updateMember,
  type RelationKind,
} from "@family/core";
import { format } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Avatar, AvatarFallback, AvatarImage } from "@family/ui/components/avatar";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@family/ui/components/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@family/ui/components/tooltip";
import { cn } from "@family/ui/lib/utils";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";
import { MemberForm } from "./member-form";

const RelativeRow = ({
  id,
  relType,
  otherId,
  onSelect,
}: {
  id: string;
  relType: "parent" | "spouse" | "sibling";
  otherId: string;
  onSelect: (id: string) => void;
}) => {
  const { dict } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const m = data.members[id];
  if (!m) return null;
  const rel =
    relType === "spouse"
      ? findRelationship(data, "spouse", id, otherId)
      : relType === "parent"
        ? (findRelationship(data, "parent", id, otherId) ??
          findRelationship(data, "parent", otherId, id))
        : undefined;

  const handleUnlink = () => {
    if (!rel) return;
    mutate(
      (d) => unlink(d, rel.id),
      { action: "relationship.delete", summary: `${m.name} ↔ ${data.members[otherId]?.name}` },
      dict.admin.editor.unlinked,
    );
  };

  return (
    <li className="group flex items-center gap-2 rounded-lg border bg-background p-2">
      <button
        type="button"
        onClick={() => onSelect(id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-start focus-visible:outline-none"
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            m.gender === "male" ? "bg-male" : "bg-female",
          )}
        />
        <span className="truncate text-sm font-medium">{m.name}</span>
        {m.birthYear && (
          <span className="text-xs text-muted-foreground tabular-nums">{m.birthYear}</span>
        )}
      </button>
      {rel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleUnlink}
              aria-label={dict.admin.editor.unlink}
              className="opacity-60 group-hover:opacity-100"
            >
              <Unlink />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{dict.admin.editor.unlink}</TooltipContent>
        </Tooltip>
      )}
    </li>
  );
};

const Section = ({
  title,
  icon: Icon,
  ids,
  relType,
  memberId,
  onSelect,
  onAdd,
  addLabel,
}: {
  title: string;
  icon: LucideIcon;
  ids: string[];
  relType: "parent" | "spouse" | "sibling";
  memberId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  addLabel: string;
}) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-muted-foreground" />
        {title}
        <Badge variant="secondary" className="tabular-nums">
          {ids.length}
        </Badge>
      </h3>
      {onAdd && (
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs">
          <UserPlus className="size-3.5" />
          {addLabel}
        </Button>
      )}
    </div>
    {ids.length > 0 && (
      <ul className="space-y-1.5">
        {ids.map((id) => (
          <RelativeRow key={id} id={id} relType={relType} otherId={memberId} onSelect={onSelect} />
        ))}
      </ul>
    )}
  </section>
);

export const MemberPanel = ({
  memberId,
  onSelect,
  onAddRelative,
  onDelete,
  onFocusView,
  showTreeLink = false,
}: {
  memberId: string;
  onSelect: (id: string) => void;
  onAddRelative: (relation: RelationKind) => void;
  onDelete: () => void;
  /** Show only this member's branch in the tree (offered when they have children). */
  onFocusView?: (id: string) => void;
  showTreeLink?: boolean;
}) => {
  const { dict, locale, dir } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const member = data.members[memberId];
  if (!member) return null;
  const isRoot = resolveRootId(data) === memberId;
  const parents = getParentIds(data, memberId);

  const handleSave = (input: Parameters<typeof updateMember>[2]) =>
    mutate(
      (d) => updateMember(d, memberId, input),
      { action: "member.update", summary: input.name },
      format(dict.admin.editor.memberUpdated, { name: input.name }),
    );

  const handleSetRoot = () =>
    mutate(
      (d) => setRoot(d, memberId),
      { action: "tree.setRoot", summary: member.name },
      dict.common.saved,
    );

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar
          className={cn(
            "size-12 border-2",
            member.gender === "male" ? "border-male/60" : "border-female/60",
          )}
        >
          {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
          <AvatarFallback className="font-semibold">{initials(member.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold">{member.name}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {formatLineage(getLineage(data, memberId), locale, 4)}
          </p>
          {isRoot && (
            <Badge variant="secondary" className="mt-1.5">
              <Crown /> {dict.admin.editor.isRoot}
            </Badge>
          )}
        </div>
      </div>
      <Tabs defaultValue="family" dir={dir} className="min-h-0 flex-1">
        <TabsList className="w-full">
          <TabsTrigger value="family">{dict.member.family}</TabsTrigger>
          <TabsTrigger value="details">{dict.member.details}</TabsTrigger>
        </TabsList>
        <TabsContent value="family" className="space-y-5 overflow-y-auto pt-3">
          <Section
            title={dict.member.parents}
            icon={Users}
            ids={parents}
            relType="parent"
            memberId={memberId}
            onSelect={onSelect}
            onAdd={parents.length < 2 ? () => onAddRelative("parent") : undefined}
            addLabel={dict.admin.editor.addParent}
          />
          <Section
            title={dict.member.spouses}
            icon={Heart}
            ids={getSpouseIds(data, memberId)}
            relType="spouse"
            memberId={memberId}
            onSelect={onSelect}
            onAdd={() => onAddRelative("spouse")}
            addLabel={dict.admin.editor.addSpouse}
          />
          <Section
            title={dict.member.children}
            icon={Baby}
            ids={getChildIds(data, memberId)}
            relType="parent"
            memberId={memberId}
            onSelect={onSelect}
            onAdd={() => onAddRelative("child")}
            addLabel={dict.admin.editor.addChild}
          />
          <Section
            title={dict.member.siblings}
            icon={Users}
            ids={getSiblingIds(data, memberId)}
            relType="sibling"
            memberId={memberId}
            onSelect={onSelect}
            onAdd={parents.length > 0 ? () => onAddRelative("sibling") : undefined}
            addLabel={dict.admin.editor.addSibling}
          />
        </TabsContent>
        <TabsContent value="details" className="overflow-y-auto pt-3">
          <MemberForm
            key={`${memberId}-${member.updatedAt}`}
            initial={member}
            submitLabel={dict.common.save}
            onSubmit={handleSave}
          />
        </TabsContent>
      </Tabs>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {onFocusView && getChildIds(data, memberId).length > 0 && (
          <Button size="sm" onClick={() => onFocusView(memberId)} title={dict.tree.focusViewHint}>
            <Network /> {dict.tree.focusView}
          </Button>
        )}
        {showTreeLink && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/editor?focus=${memberId}`}>
              <Network /> {dict.tree.showInTree}
            </Link>
          </Button>
        )}
        {!isRoot && (
          <Button variant="outline" size="sm" onClick={handleSetRoot}>
            <Crown /> {dict.admin.editor.setRoot}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="ms-auto text-destructive hover:text-destructive"
        >
          <Trash2 /> {dict.common.delete}
        </Button>
      </div>
    </div>
  );
};
