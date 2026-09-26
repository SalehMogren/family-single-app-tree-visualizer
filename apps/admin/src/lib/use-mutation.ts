"use client";

import { useCallback } from "react";
import { FamilyMutationError, type FamilyData } from "@family/core";
import { format, lookup } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { toast } from "@family/ui/lib/toast";
import { useFamilyStoreApi } from "./family-store";

/**
 * Run a mutation against the store, translating validation errors into toasts.
 * Returns the new data or null on failure.
 */
export const useMutate = () => {
  const store = useFamilyStoreApi();
  const { dict } = useI18n();
  return useCallback(
    (
      mutate: (data: FamilyData) => FamilyData,
      meta: { action: string; summary?: string },
      success?: string,
    ): FamilyData | null => {
      try {
        const next = store.getState().apply(mutate, meta);
        if (success)
          toast.success(success, {
            action: { label: dict.admin.editor.undo, onClick: () => store.getState().undo() },
          });
        return next;
      } catch (error) {
        if (error instanceof FamilyMutationError) {
          toast.error(format(lookup(dict.issues, error.code, dict.common.error), error.params));
          return null;
        }
        throw error;
      }
    },
    [store, dict],
  );
};
