"use client";

import { useMemo, useState } from "react";
import {
  addRelative,
  getChildIds,
  getParentIds,
  getSpouseIds,
  linkParent,
  linkSpouses,
  validateNewRelative,
  validateParentLink,
  validateSpouseLink,
  type Member,
  type RelationKind,
} from "@family/core";
import { format } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { Checkbox } from "@family/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@family/ui/components/dialog";
import { Label } from "@family/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@family/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@family/ui/components/tabs";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";
import { IssuesList } from "./issues-list";
import { MemberForm } from "./member-form";
import { PersonPicker } from "./person-picker";

export interface AddRelativeRequest {
  targetId: string;
  relation: RelationKind;
}

const UNKNOWN = "__unknown__";

export const AddRelativeDialog = ({
  request,
  onOpenChange,
  onAdded,
}: {
  request: AddRelativeRequest | null;
  onOpenChange: (open: boolean) => void;
  onAdded?: (id: string) => void;
}) => {
  const { dict, dir } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const [tab, setTab] = useState("new");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pick<
    Member,
    "name" | "gender" | "birthYear" | "deathYear"
  > | null>(null);
  const [otherParent, setOtherParent] = useState<string>("");
  const [adopt, setAdopt] = useState(true);

  const target = request ? data.members[request.targetId] : null;
  const relation = request?.relation;

  const relationLabel = relation
    ? {
        parent: dict.admin.editor.relationParent,
        child: dict.admin.editor.relationChild,
        spouse: dict.admin.editor.relationSpouse,
        sibling: dict.admin.editor.relationSibling,
      }[relation]
    : "";

  const defaultGender = useMemo<Member["gender"]>(() => {
    if (!target || !relation) return "male";
    if (relation === "spouse") return target.gender === "male" ? "female" : "male";
    if (relation === "parent") {
      const hasFather = getParentIds(data, target.id).some(
        (p) => data.members[p]?.gender === "male",
      );
      return hasFather ? "female" : "male";
    }
    return "male";
  }, [data, target, relation]);

  const spouses = target ? getSpouseIds(data, target.id) : [];
  const singleParentChildren = target
    ? getChildIds(data, target.id).filter((c) => getParentIds(data, c).length === 1)
    : [];
  const effectiveOtherParent = otherParent || (spouses.length === 1 ? spouses[0] : UNKNOWN);

  const newIssues = useMemo(
    () =>
      target && relation && draft
        ? validateNewRelative(data, target.id, relation, draft).issues
        : [],
    [data, target, relation, draft],
  );

  const existingIssues = useMemo(() => {
    if (!target || !relation || !existingId) return [];
    if (relation === "parent") return validateParentLink(data, existingId, target.id).issues;
    if (relation === "child") return validateParentLink(data, target.id, existingId).issues;
    if (relation === "spouse") return validateSpouseLink(data, target.id, existingId).issues;
    return getParentIds(data, target.id).flatMap(
      (p) => validateParentLink(data, p, existingId).issues,
    );
  }, [data, target, relation, existingId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTab("new");
      setExistingId(null);
      setDraft(null);
      setOtherParent("");
      setAdopt(true);
    }
    onOpenChange(open);
  };

  if (!request || !target || !relation) return null;

  const handleCreate = (input: Parameters<typeof addRelative>[3]) => {
    let createdId: string | null = null;
    const next = mutate(
      (d) => {
        const result = addRelative(d, target.id, relation, input, {
          otherParentId:
            relation === "child"
              ? effectiveOtherParent === UNKNOWN
                ? null
                : effectiveOtherParent
              : undefined,
          adoptChildIds: relation === "spouse" && adopt ? singleParentChildren : [],
        });
        createdId = result.member.id;
        return result.data;
      },
      { action: "member.create", summary: `${input.name} (${relation} of ${target.name})` },
      format(dict.admin.editor.memberAdded, { name: input.name }),
    );
    if (next && createdId) {
      onAdded?.(createdId);
      handleOpenChange(false);
    }
  };

  const handleLinkExisting = () => {
    if (!existingId) return;
    const other = data.members[existingId];
    const next = mutate(
      (d) => {
        if (relation === "parent") return linkParent(d, existingId, target.id);
        if (relation === "child") return linkParent(d, target.id, existingId);
        if (relation === "spouse") return linkSpouses(d, target.id, existingId);
        return getParentIds(d, target.id).reduce((acc, p) => linkParent(acc, p, existingId), d);
      },
      { action: "relationship.create", summary: `${other?.name} ↔ ${target.name} (${relation})` },
      dict.admin.editor.linked,
    );
    if (next) handleOpenChange(false);
  };

  const hasBlockingNew = newIssues.some((i) => i.level === "error");

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
        closeLabel={dict.common.close}
      >
        <DialogHeader>
          <DialogTitle>
            {format(dict.admin.editor.addRelativeTitle, {
              relation: relationLabel,
              name: target.name,
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">{relationLabel}</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} dir={dir}>
          <TabsList className="w-full">
            <TabsTrigger value="new">{dict.admin.editor.newPerson}</TabsTrigger>
            <TabsTrigger value="existing">{dict.admin.editor.existingPerson}</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="pt-3">
            <MemberForm
              key={`${request.targetId}-${relation}`}
              initial={{ gender: defaultGender }}
              submitLabel={dict.common.add}
              onSubmit={handleCreate}
              onCancel={() => handleOpenChange(false)}
              onDraftChange={setDraft}
              compact
            >
              {relation === "child" && (
                <div className="space-y-1.5">
                  <Label>{dict.admin.editor.otherParent}</Label>
                  <Select dir={dir} value={effectiveOtherParent} onValueChange={setOtherParent}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spouses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {data.members[s]?.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={UNKNOWN}>{dict.admin.editor.unknownParent}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {relation === "spouse" && singleParentChildren.length > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={adopt} onCheckedChange={(v) => setAdopt(v === true)} />
                  {format(dict.admin.editor.adoptChildren, { name: target.name })} (
                  {singleParentChildren.length})
                </label>
              )}
              <IssuesList issues={newIssues} />
              {hasBlockingNew && <span className="sr-only">{dict.admin.editor.warningsTitle}</span>}
            </MemberForm>
          </TabsContent>
          <TabsContent value="existing" className="space-y-4 pt-3">
            <PersonPicker
              data={data}
              value={existingId}
              onChange={setExistingId}
              exclude={[target.id]}
            />
            <IssuesList issues={existingIssues} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {dict.common.cancel}
              </Button>
              <Button
                onClick={handleLinkExisting}
                disabled={!existingId || existingIssues.some((i) => i.level === "error")}
              >
                {dict.admin.editor.linkExisting}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
