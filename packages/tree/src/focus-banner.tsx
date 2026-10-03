"use client";

import { ChevronLeft, ChevronRight, Network, X } from "lucide-react";
import { getDescendantIds, getLineage, type FamilyData } from "@family/core";
import { format, formatNumber } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { cn } from "@family/ui/lib/utils";

/**
 * Shown while the tree is in focus view: breadcrumb back up the lineage (click an ancestor
 * to widen the branch), descendant count, and a button to return to the full tree.
 */
export const FocusBanner = ({
  data,
  focusId,
  onFocus,
  onExit,
  className,
}: {
  data: FamilyData;
  focusId: string;
  onFocus: (id: string) => void;
  onExit: () => void;
  className?: string;
}) => {
  const { dict, locale, dir } = useI18n();
  const member = data.members[focusId];
  if (!member) return null;
  // Ancestors from the top down, ending with the focused member.
  const trail = getLineage(data, focusId, 50).reverse();
  const shown = trail.length > 4 ? [trail[0], null, ...trail.slice(-3)] : trail;
  const Separator = dir === "rtl" ? ChevronLeft : ChevronRight;
  const descendants = getDescendantIds(data, focusId).size;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card/95 py-1.5 ps-3 pe-1.5 shadow-sm backdrop-blur",
        className,
      )}
    >
      <Network className="size-4 shrink-0 text-primary" aria-hidden />
      <nav aria-label={dict.tree.focusView} className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm whitespace-nowrap">
          {shown.map((m, i) => (
            <li key={m?.id ?? `gap-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <Separator className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              {!m ? (
                <span className="text-muted-foreground">…</span>
              ) : m.id === focusId ? (
                <span className="font-semibold" aria-current="true">
                  {format(dict.tree.focusBranch, { name: m.name })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onFocus(m.id)}
                  className="rounded px-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {m.name}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">
        {format(dict.member.descendantsCount, { count: formatNumber(locale, descendants) })}
      </span>
      <Button variant="secondary" size="sm" onClick={onExit} className="shrink-0">
        <X />
        {dict.tree.exitFocus}
      </Button>
    </div>
  );
};
