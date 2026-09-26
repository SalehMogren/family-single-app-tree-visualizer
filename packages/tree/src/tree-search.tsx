"use client";

import { useEffect, useMemo, useState } from "react";
import { searchMembers, type FamilyData } from "@family/core";
import { useI18n } from "@family/i18n/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@family/ui/components/command";
import { useDebouncedValue } from "@family/ui/hooks/use-debounced-value";

/** ⌘K / "/" search palette with Arabic-normalised matching over names and lineage. */
export const TreeSearch = ({
  data,
  open,
  onOpenChange,
  onPick,
}: {
  data: FamilyData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (id: string) => void;
}) => {
  const { dict, dir } = useI18n();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 120);
  const hits = useMemo(() => searchMembers(data, debounced, 30), [data, debounced]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) setQuery("");
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={dict.common.search}
      description={dict.common.searchPlaceholder}
      shouldFilter={false}
    >
      <div dir={dir}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={dict.tree.search} />
        <CommandList>
          {debounced && <CommandEmpty>{dict.tree.noResults}</CommandEmpty>}
          {hits.length > 0 && (
            <CommandGroup>
              {hits.map((hit) => (
                <CommandItem
                  key={hit.member.id}
                  value={hit.member.id}
                  onSelect={() => {
                    onPick(hit.member.id);
                    handleOpenChange(false);
                  }}
                >
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${hit.member.gender === "male" ? "bg-male" : "bg-female"}`}
                  />
                  <span className="truncate">{hit.lineage}</span>
                  {hit.member.birthYear && (
                    <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                      {hit.member.birthYear}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
};
