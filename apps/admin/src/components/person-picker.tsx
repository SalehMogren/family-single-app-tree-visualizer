"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { formatLineage, getLineage, searchMembers, type FamilyData } from "@family/core";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@family/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@family/ui/components/popover";
import { cn } from "@family/ui/lib/utils";

/** Searchable combobox over all members (Arabic-normalised). */
export const PersonPicker = ({
  data,
  value,
  onChange,
  exclude = [],
  placeholder,
  id,
}: {
  data: FamilyData;
  value: string | null;
  onChange: (id: string) => void;
  exclude?: string[];
  placeholder?: string;
  id?: string;
}) => {
  const { dict, locale, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const excluded = new Set(exclude);
    const list = query
      ? searchMembers(data, query, 40).map((h) => ({
          id: h.member.id,
          label: h.lineage,
          year: h.member.birthYear,
        }))
      : Object.values(data.members)
          .slice(0, 40)
          .map((m) => ({
            id: m.id,
            label: formatLineage(getLineage(data, m.id), locale, 3),
            year: m.birthYear,
          }));
    return list.filter((r) => !excluded.has(r.id));
  }, [data, query, exclude, locale]);
  const selected = value ? data.members[value] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected
              ? formatLineage(getLineage(data, selected.id), locale, 3)
              : (placeholder ?? dict.admin.editor.choosePerson)}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false} dir={dir}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={dict.common.searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>{dict.tree.noResults}</CommandEmpty>
            <CommandGroup>
              {results.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.id}
                  onSelect={() => {
                    onChange(r.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value === r.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{r.label}</span>
                  {r.year && (
                    <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                      {r.year}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
