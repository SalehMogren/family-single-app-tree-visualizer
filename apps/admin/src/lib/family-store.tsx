"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { FamilyData } from "@family/core";
import { saveFamilyAction } from "./actions";

const HISTORY_LIMIT = 50;
const SAVE_DELAY = 700;

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

interface Meta {
  action: string;
  summary?: string;
}

export interface FamilyState {
  data: FamilyData;
  /** Revision the server has; sent as expectedRevision to detect concurrent edits. */
  serverRevision: number;
  past: FamilyData[];
  future: FamilyData[];
  status: SaveStatus;
  lastMeta: Meta | null;
  /** Apply a pure mutation. Throws (e.g. FamilyMutationError) without changing state. */
  apply: (mutate: (data: FamilyData) => FamilyData, meta: Meta) => FamilyData;
  undo: () => void;
  redo: () => void;
  /** Replace everything with server data (after reload / import / restore). */
  reset: (data: FamilyData) => void;
  flush: () => Promise<void>;
}

const createFamilyStore = (initial: FamilyData) => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const store = createStore<FamilyState>()((set, get) => {
    const save = async () => {
      timer = null;
      const { data, serverRevision, lastMeta, status } = get();
      if (status === "conflict") return;
      set({ status: "saving" });
      const result = await saveFamilyAction(data, {
        expectedRevision: serverRevision,
        action: lastMeta?.action ?? "tree.edit",
        summary: lastMeta?.summary,
      });
      if (result.ok) {
        // Newer local edits may have happened while saving: keep them dirty.
        const stillSame = get().data === data;
        set({ serverRevision: result.value.revision, status: stillSame ? "saved" : "dirty" });
        if (!stillSame) schedule();
        return;
      }
      set({ status: result.code === "revisionConflict" ? "conflict" : "error" });
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, SAVE_DELAY);
    };

    const commit = (data: FamilyData, patch: Partial<FamilyState>) => {
      set({ ...patch, data, status: get().status === "conflict" ? "conflict" : "dirty" });
      schedule();
    };

    return {
      data: initial,
      serverRevision: initial.revision,
      past: [],
      future: [],
      status: "saved",
      lastMeta: null,
      apply: (mutate, meta) => {
        const current = get().data;
        const next = mutate(current);
        commit(next, {
          past: [...get().past, current].slice(-HISTORY_LIMIT),
          future: [],
          lastMeta: meta,
        });
        return next;
      },
      undo: () => {
        const { past, data, future } = get();
        const previous = past.at(-1);
        if (!previous) return;
        commit(previous, {
          past: past.slice(0, -1),
          future: [data, ...future].slice(0, HISTORY_LIMIT),
          lastMeta: { action: "tree.undo" },
        });
      },
      redo: () => {
        const { past, data, future } = get();
        const [next, ...rest] = future;
        if (!next) return;
        commit(next, {
          past: [...past, data].slice(-HISTORY_LIMIT),
          future: rest,
          lastMeta: { action: "tree.redo" },
        });
      },
      reset: (data) => {
        if (timer) clearTimeout(timer);
        set({
          data,
          serverRevision: data.revision,
          past: [],
          future: [],
          status: "saved",
          lastMeta: null,
        });
      },
      flush: async () => {
        if (!timer) return;
        clearTimeout(timer);
        await save();
      },
    };
  });
  return store;
};

const FamilyStoreContext = createContext<StoreApi<FamilyState> | null>(null);

export const FamilyStoreProvider = ({
  initial,
  children,
}: {
  initial: FamilyData;
  children: ReactNode;
}) => {
  const [store] = useState(() => createFamilyStore(initial));

  // Pick up server-side changes (router.refresh after import/restore) when we have nothing pending.
  useEffect(() => {
    const { serverRevision, status } = store.getState();
    if (initial.revision > serverRevision && (status === "saved" || status === "conflict"))
      store.getState().reset(initial);
  }, [initial, store]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const { status } = store.getState();
      if (status === "dirty" || status === "saving") event.preventDefault();
    };
    // Save right away when the tab is hidden/closed instead of waiting for the debounce.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") void store.getState().flush();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [store]);

  return <FamilyStoreContext.Provider value={store}>{children}</FamilyStoreContext.Provider>;
};

export const useFamilyStore = <T,>(selector: (state: FamilyState) => T): T => {
  const store = useContext(FamilyStoreContext);
  if (!store) throw new Error("useFamilyStore must be used inside <FamilyStoreProvider>");
  return useStore(store, selector);
};

export const useFamilyStoreApi = () => {
  const store = useContext(FamilyStoreContext);
  if (!store) throw new Error("useFamilyStoreApi must be used inside <FamilyStoreProvider>");
  return store;
};
