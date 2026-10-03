"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, MousePointerClick } from "lucide-react";
import { addMember, analyzeHealth, getChildIds, type RelationKind } from "@family/core";
import { format } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import {
  FamilyTreeView,
  FocusBanner,
  SearchTrigger,
  TreeControls,
  TreeSearch,
  useTreeState,
  type FamilyTreeHandle,
} from "@family/tree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@family/ui/components/card";
import { EmptyState } from "@family/ui/components/empty-state";
import { Sheet, SheetContent, SheetTitle } from "@family/ui/components/sheet";
import { useMediaQuery } from "@family/ui/hooks/use-media-query";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";
import { AddRelativeDialog, type AddRelativeRequest } from "./add-relative-dialog";
import { DeleteMemberDialog } from "./delete-member-dialog";
import { MemberForm } from "./member-form";
import { MemberPanel } from "./member-panel";

export const TreeEditor = ({
  initialFocusId,
  initialRootId = null,
}: {
  /** Member selected on open (?focus=). */
  initialFocusId: string | null;
  /** Member whose branch is shown in focus view on open (?root=). */
  initialRootId?: string | null;
}) => {
  const { dict, dir } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const treeRef = useRef<FamilyTreeHandle>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [searchOpen, setSearchOpen] = useState(false);
  const [addRequest, setAddRequest] = useState<AddRelativeRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const tree = useTreeState(data, {
    initialSelectedId: initialFocusId && data.members[initialFocusId] ? initialFocusId : null,
    initialFocusId: initialRootId && data.members[initialRootId] ? initialRootId : null,
  });
  const { selectedId, setSelectedId, reveal, focusOn, focusId, exitFocus } = tree;

  // Keep ?focus= (selection) and ?root= (focus view) in the URL so views can be shared/reloaded.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("focus", selectedId);
    else url.searchParams.delete("focus");
    if (focusId) url.searchParams.set("root", focusId);
    else url.searchParams.delete("root");
    window.history.replaceState(null, "", url);
  }, [selectedId, focusId]);

  const fitSoon = useCallback(
    () => requestAnimationFrame(() => requestAnimationFrame(() => treeRef.current?.fit())),
    [],
  );

  /** Show only this member's branch (them, their spouses and descendants). */
  const handleFocusView = useCallback(
    (id: string) => {
      focusOn(id);
      setSelectedId(id);
      fitSoon();
    },
    [focusOn, setSelectedId, fitSoon],
  );

  const handleExitFocus = useCallback(() => {
    exitFocus();
    if (!selectedId) return fitSoon();
    requestAnimationFrame(() => requestAnimationFrame(() => treeRef.current?.centerOn(selectedId)));
  }, [exitFocus, selectedId, fitSoon]);

  // Double-click a member with children to open their branch.
  const handleActivate = useCallback(
    (id: string) => {
      if (getChildIds(data, id).length > 0 && id !== focusId) handleFocusView(id);
    },
    [data, focusId, handleFocusView],
  );

  // Data-health badges on cards.
  const badges = useMemo(() => {
    const map = new Map<string, "error" | "warning" | "info">();
    for (const issue of analyzeHealth(data)) {
      if (issue.level === "info") continue;
      for (const id of issue.memberIds.slice(0, 1)) if (!map.has(id)) map.set(id, issue.level);
    }
    return map;
  }, [data]);
  const getBadge = useCallback((id: string) => badges.get(id) ?? null, [badges]);

  const labels = useMemo(
    () => ({
      collapse: dict.tree.collapse,
      expand: dict.tree.expand,
      marriedIn: dict.tree.marriedIn,
      deceased: dict.common.deceased,
      treeLabel: dict.admin.editor.title,
    }),
    [dict],
  );

  // Drop the selection if the member was deleted (e.g. via undo of a creation).
  useEffect(() => {
    if (selectedId && !data.members[selectedId]) setSelectedId(null);
  }, [data, selectedId, setSelectedId]);

  const focusPerson = useCallback(
    (id: string) => {
      reveal(id);
      setSelectedId(id);
      requestAnimationFrame(() => requestAnimationFrame(() => treeRef.current?.centerOn(id)));
    },
    [reveal, setSelectedId],
  );

  const handleAddRelative = (relation: RelationKind) =>
    selectedId && setAddRequest({ targetId: selectedId, relation });

  const handleCreateFirst = (input: Parameters<typeof addMember>[1]) => {
    let id = "";
    mutate(
      (d) => {
        const result = addMember(d, input);
        id = result.member.id;
        return result.data;
      },
      { action: "member.create", summary: input.name },
      format(dict.admin.editor.memberAdded, { name: input.name }),
    );
    if (id) setSelectedId(id);
  };

  if (!Object.keys(data.members).length) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>{dict.tree.empty}</CardTitle>
            <CardDescription>{dict.admin.dashboard.addMember}</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberForm submitLabel={dict.common.create} onSubmit={handleCreateFirst} compact />
          </CardContent>
        </Card>
      </div>
    );
  }

  const panel = selectedId ? (
    <MemberPanel
      key={selectedId}
      memberId={selectedId}
      onSelect={focusPerson}
      onAddRelative={handleAddRelative}
      onDelete={() => setDeleteId(selectedId)}
      onFocusView={selectedId !== focusId ? handleFocusView : undefined}
    />
  ) : (
    <EmptyState
      icon={<MousePointerClick />}
      title={dict.admin.editor.selectHint}
      description={dict.admin.editor.shortcuts}
      className="h-full border-0"
    />
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <div className="relative min-w-0 flex-1">
        <FamilyTreeView
          ref={treeRef}
          data={data}
          rootId={tree.rootId}
          rtl={dir === "rtl"}
          collapsed={tree.collapsed}
          onToggleCollapse={tree.toggleCollapse}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onActivate={handleActivate}
          getBadge={getBadge}
          labels={labels}
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-2">
          <SearchTrigger
            onClick={() => setSearchOpen(true)}
            className="pointer-events-auto min-w-0 flex-1 sm:max-w-xs"
          />
        </div>
        {focusId && (
          <FocusBanner
            data={data}
            focusId={focusId}
            onFocus={handleFocusView}
            onExit={handleExitFocus}
            className="absolute start-3 end-16 top-14 mx-auto max-w-2xl"
          />
        )}
        <TreeControls
          treeRef={treeRef}
          onExpandAll={tree.expandAll}
          onCollapseAll={tree.collapseAll}
          className="absolute end-3 top-3"
        />
        <p className="pointer-events-none absolute bottom-3 hidden items-center gap-1.5 text-xs text-muted-foreground ltr:left-3 rtl:right-3 xl:flex">
          <Keyboard className="size-3.5" /> {dict.admin.editor.shortcuts} · {dict.tree.focusTip}
        </p>
      </div>
      {isDesktop ? (
        <aside className="w-[24rem] shrink-0 overflow-y-auto border-s bg-card p-5">{panel}</aside>
      ) : (
        <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent side="bottom" closeLabel={dict.common.close} className="h-[80dvh] p-5">
            <SheetTitle className="sr-only">
              {selectedId ? data.members[selectedId]?.name : ""}
            </SheetTitle>
            {panel}
          </SheetContent>
        </Sheet>
      )}
      <AddRelativeDialog
        request={addRequest}
        onOpenChange={(open) => !open && setAddRequest(null)}
        onAdded={(id) => {
          if (addRequest) reveal(addRequest.targetId);
          requestAnimationFrame(() => requestAnimationFrame(() => treeRef.current?.centerOn(id)));
        }}
      />
      <DeleteMemberDialog
        memberId={deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onDeleted={() => setSelectedId(null)}
      />
      <TreeSearch data={data} open={searchOpen} onOpenChange={setSearchOpen} onPick={focusPerson} />
      <span className="sr-only" aria-live="polite">
        {selectedId ? data.members[selectedId]?.name : ""}
      </span>
    </div>
  );
};
