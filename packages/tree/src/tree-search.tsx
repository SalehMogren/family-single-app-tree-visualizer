"use client";

import { useEffect, useMemo, useState } from "react";
import { searchMembers, type FamilyData } from "@family/core";
import { useI18n } from "@family/i18n/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@family/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@family/ui/components/dialog";
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="top-[20%] translate-y-0 overflow-hidden p-0"
        showCloseButton={false}
        closeLabel={dict.common.close}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{dict.common.search}</DialogTitle>
          <DialogDescription>{dict.common.searchPlaceholder}</DialogDescription>
        </DialogHeader>
        {/* Filtering is done by searchMembers (Arabic-aware), so cmdk's own filter is off. */}
        <Command
          shouldFilter={false}
          dir={dir}
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-item]]:py-2.5"
        >
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
        </Command>
      </DialogContent>
    </Dialog>
  );
};
