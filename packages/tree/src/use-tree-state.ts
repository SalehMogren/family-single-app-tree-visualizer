"use client";

import { useCallback, useMemo, useState } from "react";
import {
  collapseBeyondDepth,
  getChildIds,
  getGenerations,
  getLineage,
  pathToRoot,
  resolveRootId,
  type FamilyData,
} from "@family/core";

/** Collapse / selection / lineage-highlight state shared by the public and admin trees. */
export const useTreeState = (
  data: FamilyData,
  { initialDepth = 0, initialSelectedId = null as string | null } = {},
) => {
  const rootId = resolveRootId(data);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const set = collapseBeyondDepth(data, initialDepth, rootId);
    if (initialSelectedId)
      for (const id of pathToRoot(data, initialSelectedId, rootId)) set.delete(id);
    return set;
  });
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [highlightLineage, setHighlightLineage] = useState(false);

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

  /** Expand every ancestor so `id` is rendered. */
  const reveal = useCallback(
    (id: string) => {
      const path = pathToRoot(data, id, rootId);
      setCollapsed((prev) => {
        if (!path.some((p) => prev.has(p))) return prev;
        const next = new Set(prev);
        for (const p of path) next.delete(p);
        return next;
      });
    },
    [data, rootId],
  );

  const highlightIds = useMemo(() => {
    if (!highlightLineage || !selectedId) return null;
    return new Set(getLineage(data, selectedId, 50).map((m) => m.id));
  }, [data, selectedId, highlightLineage]);

  return {
    rootId,
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
