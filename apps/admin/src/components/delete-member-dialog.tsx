"use client";

import { useState } from "react";
import { getDeletionImpact, removeMember } from "@family/core";
import { format } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@family/ui/components/alert-dialog";
import { Checkbox } from "@family/ui/components/checkbox";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";

export const DeleteMemberDialog = ({
  memberId,
  onOpenChange,
  onDeleted,
}: {
  memberId: string | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) => {
  const { dict } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const [cascade, setCascade] = useState(false);
  const member = memberId ? data.members[memberId] : null;
  if (!member || !memberId) return null;
  const impact = getDeletionImpact(data, memberId);

  const handleDelete = () => {
    const next = mutate(
      (d) => removeMember(d, memberId, { cascade }),
      {
        action: "member.delete",
        summary: member.name + (cascade ? ` (+${impact.descendantIds.length})` : ""),
      },
      format(dict.admin.editor.memberDeleted, { name: member.name }),
    );
    if (next) onDeleted?.();
    setCascade(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {format(dict.admin.members.deleteTitle, { name: member.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {format(dict.admin.members.deleteDescription, { relationships: impact.relationships })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 text-sm">
          {impact.isRoot && (
            <p className="rounded-md bg-warning/15 p-2">{dict.admin.members.rootWarning}</p>
          )}
          {impact.orphanedChildIds.length > 0 && !cascade && (
            <p className="rounded-md bg-warning/15 p-2">
              {format(dict.admin.members.orphanWarning, { count: impact.orphanedChildIds.length })}
            </p>
          )}
          {impact.descendantIds.length > 0 && (
            <label className="flex items-center gap-2">
              <Checkbox checked={cascade} onCheckedChange={(v) => setCascade(v === true)} />
              {format(dict.admin.members.deleteCascade, { count: impact.descendantIds.length })}
            </label>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            {dict.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
