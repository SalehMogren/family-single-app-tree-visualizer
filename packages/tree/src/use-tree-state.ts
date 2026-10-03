"use client";

import { useCallback, useMemo, useState } from "react";
import {
  collapseBeyondDepth,
  getChildIds,
  getDescendantIds,
  getGenerations,
  getLineage,
  getSpouseIds,
  pathToRoot,
  resolveRootId,
  type FamilyData,
} from "@family/core";

/**
 * Collapse / selection / lineage-highlight / focus-view state shared by the public and
 * admin trees. In focus view the tree is re-rooted at one member, showing only them, their
 * spouses and their descendants.
 */
export const useTreeState = (
  data: FamilyData,
  {
    initialDepth = 0,
    initialSelectedId = null as string | null,
    initialFocusId = null as string | null,
  } = {},
) => {
  const fullRootId = resolveRootId(data);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const set = collapseBeyondDepth(data, initialDepth, fullRootId);
    if (initialSelectedId)
      for (const id of pathToRoot(data, initialSelectedId, fullRootId)) set.delete(id);
    if (initialFocusId) set.delete(initialFocusId);
    return set;
  });
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [highlightLineage, setHighlightLineage] = useState(false);
  const [rawFocusId, setRawFocusId] = useState<string | null>(initialFocusId);

  // A focused member that was deleted (e.g. by undo) silently ends the focus view.
  const focusId = rawFocusId && data.members[rawFocusId] ? rawFocusId : null;
  const rootId = focusId ?? fullRootId;

  /** Members visible in the current focus view (focus person, descendants and their spouses). */
  const focusMembers = useMemo(() => {
    if (!focusId) return null;
    const blood = new Set([focusId, ...getDescendantIds(data, focusId)]);
    const all = new Set(blood);
    for (const id of blood) for (const s of getSpouseIds(data, id)) all.add(s);
    return all;
  }, [data, focusId]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  const collapseAll = useCallback(() => {
    const generations = getGenerations(data, rootId);
    setCollapsed(
      new Set(
        [...generations.keys()].filter((id) => id !== rootId && getChildIds(data, id).length > 0),
      ),
    );
  }, [data, rootId]);

  /** Show only `id` and their descendants. */
  const focusOn = useCallback((id: string) => {
    setRawFocusId(id);
    setCollapsed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const exitFocus = useCallback(() => setRawFocusId(null), []);

  /** Expand every ancestor so `id` is rendered; leaves focus view if `id` is outside it. */
  const reveal = useCallback(
    (id: string) => {
      if (focusMembers && !focusMembers.has(id)) setRawFocusId(null);
      const path = pathToRoot(data, id, fullRootId);
      setCollapsed((prev) => {
        if (!path.some((p) => prev.has(p))) return prev;
        const next = new Set(prev);
        for (const p of path) next.delete(p);
        return next;
      });
    },
    [data, fullRootId, focusMembers],
  );

  const highlightIds = useMemo(() => {
    if (!highlightLineage || !selectedId) return null;
    return new Set(getLineage(data, selectedId, 50).map((m) => m.id));
  }, [data, selectedId, highlightLineage]);

  return {
    /** Root currently rendered (the focus member in focus view). */
    rootId,
    fullRootId,
    focusId,
    focusOn,
    exitFocus,
    collapsed,
    setCollapsed,
    toggleCollapse,
    expandAll,
    collapseAll,
    reveal,
    selectedId,
    setSelectedId,
    highlightLineage,
    setHighlightLineage,
    highlightIds,
  };
};
