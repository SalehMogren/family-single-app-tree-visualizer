"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CloudOff, Loader2, Redo2, RefreshCw, Undo2 } from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@family/ui/components/tooltip";
import { useFamilyStore } from "@/lib/family-store";

export const SaveStatus = () => {
  const { dict } = useI18n();
  const router = useRouter();
  const status = useFamilyStore((s) => s.status);
  const canUndo = useFamilyStore((s) => s.past.length > 0);
  const canRedo = useFamilyStore((s) => s.future.length > 0);
  const undo = useFamilyStore((s) => s.undo);
  const redo = useFamilyStore((s) => s.redo);
  const reset = useFamilyStore((s) => s.reset);
  const flush = useFamilyStore((s) => s.flush);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA"].includes(target.tagName)))
        return;
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      } else if (key === "s") {
        event.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, flush]);

  const handleReload = async () => {
    const response = await fetch("/api/export?format=json", { cache: "no-store" });
    if (response.ok) reset(await response.json());
    router.refresh();
  };

  const label = {
    saved: dict.admin.editor.allSaved,
    dirty: dict.admin.editor.unsaved,
    saving: dict.admin.editor.saving,
    error: dict.admin.editor.saveFailed,
    conflict: dict.admin.editor.conflictTitle,
  }[status];
  const Icon = {
    saved: Check,
    dirty: Loader2,
    saving: Loader2,
    error: CloudOff,
    conflict: AlertTriangle,
  }[status];

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={undo}
            disabled={!canUndo}
            aria-label={dict.admin.editor.undo}
          >
            <Undo2 className="rtl:-scale-x-100" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{dict.admin.editor.undo} (Ctrl+Z)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={redo}
            disabled={!canRedo}
            aria-label={dict.admin.editor.redo}
          >
            <Redo2 className="rtl:-scale-x-100" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{dict.admin.editor.redo} (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>
      <span
        role="status"
        aria-live="polite"
        className={`ms-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          status === "error" || status === "conflict"
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground"
        }`}
      >
        <Icon
          className={`size-3.5 ${status === "saving" || status === "dirty" ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">{label}</span>
      </span>
      {(status === "conflict" || status === "error") && (
        <Button
          size="sm"
          variant="outline"
          onClick={status === "conflict" ? handleReload : () => void flush()}
        >
          <RefreshCw />
          {status === "conflict" ? dict.admin.editor.reload : dict.common.tryAgain}
        </Button>
      )}
    </div>
  );
};
