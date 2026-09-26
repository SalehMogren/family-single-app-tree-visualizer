"use client";

import { Loader2, Save } from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";

export const SaveBar = ({
  dirty,
  pending,
  onSave,
  onReset,
}: {
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  onReset: () => void;
}) => {
  const { dict } = useI18n();
  if (!dirty && !pending) return null;
  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border bg-card/95 py-2 ps-5 pe-2 shadow-lg backdrop-blur">
      <span className="text-sm text-muted-foreground">{dict.admin.editor.unsaved}</span>
      <Button variant="ghost" size="sm" onClick={onReset} disabled={pending}>
        {dict.common.reset}
      </Button>
      <Button size="sm" onClick={onSave} disabled={pending} className="rounded-full">
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        {dict.common.save}
      </Button>
    </div>
  );
};
