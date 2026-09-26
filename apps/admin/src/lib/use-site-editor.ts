"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@family/core";
import { lookup } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { toast } from "@family/ui/components/sonner";
import { saveSiteAction } from "./actions";

/** Local draft of site content with an explicit save (content edits are deliberate, not autosaved). */
export const useSiteEditor = (initial: SiteContent, action: string) => {
  const { dict } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const save = (next = draft) =>
    startTransition(async () => {
      const result = await saveSiteAction(next, { action });
      if (!result.ok) {
        toast.error(lookup(dict.issues, result.code, dict.common.error));
        return;
      }
      setDraft(result.value);
      setBaseline(result.value);
      toast.success(dict.common.saved);
      router.refresh();
    });

  return { draft, setDraft, dirty, pending, save, reset: () => setDraft(baseline) };
};
