"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { normalizeText, initials } from "@family/core";
import { format } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Avatar, AvatarFallback, AvatarImage } from "@family/ui/components/avatar";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import { EmptyState } from "@family/ui/components/empty-state";
import { Input } from "@family/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@family/ui/components/select";
import { cn } from "@family/ui/lib/utils";
import type { DirectoryRow } from "@/lib/directory";

const PAGE = 48;

export const MemberDirectory = ({
  rows,
  initialQuery,
}: {
  rows: DirectoryRow[];
  initialQuery: string;
}) => {
  const { dict, dir, locale } = useI18n();
  const [query, setQuery] = useState(initialQuery);
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [generation, setGeneration] = useState("all");
  const [sort, setSort] = useState("generation");
  const [limit, setLimit] = useState(PAGE);
  const deferredQuery = useDeferredValue(query);

  const generations = useMemo(
    () =>
      [...new Set(rows.map((r) => r.generation).filter((g): g is number => g !== null))].sort(
        (a, b) => a - b,
      ),
    [rows],
  );

  const indexed = useMemo(
    () =>
      rows.map((r) => ({ row: r, haystack: normalizeText(`${r.lineage} ${r.occupation ?? ""}`) })),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = normalizeText(deferredQuery);
    const result = indexed
      .filter(({ row, haystack }) => {
        if (q && !haystack.includes(q)) return false;
        if (gender !== "all" && row.gender !== gender) return false;
        if (status === "living" && !row.living) return false;
        if (status === "deceased" && row.living) return false;
        if (generation === "inlaw" && row.generation !== null) return false;
        if (generation !== "all" && generation !== "inlaw" && row.generation !== Number(generation))
          return false;
        return true;
      })
      .map(({ row }) => row);
    const byName = (a: DirectoryRow, b: DirectoryRow) => a.lineage.localeCompare(b.lineage, locale);
    const byBirth = (a: DirectoryRow, b: DirectoryRow) =>
      (a.birthYear ?? 9999) - (b.birthYear ?? 9999) || byName(a, b);
    const byGeneration = (a: DirectoryRow, b: DirectoryRow) =>
      (a.generation ?? 99) - (b.generation ?? 99) || byBirth(a, b);
    return result.sort(sort === "name" ? byName : sort === "birth" ? byBirth : byGeneration);
  }, [indexed, deferredQuery, gender, status, generation, sort, locale]);

  const handleReset = () => {
    setQuery("");
    setGender("all");
    setStatus("all");
    setGeneration("all");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder={dict.common.searchPlaceholder}
          aria-label={dict.common.search}
          className="h-10 bg-card sm:col-span-2 lg:col-span-1"
          autoFocus={!!initialQuery}
        />
        <Select dir={dir} value={gender} onValueChange={setGender}>
          <SelectTrigger className="h-10 w-full bg-card lg:w-36" aria-label={dict.directory.gender}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {dict.directory.gender}: {dict.common.all}
            </SelectItem>
            <SelectItem value="male">{dict.common.male}</SelectItem>
            <SelectItem value="female">{dict.common.female}</SelectItem>
          </SelectContent>
        </Select>
        <Select dir={dir} value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-full bg-card lg:w-40" aria-label={dict.directory.status}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {dict.directory.status}: {dict.common.all}
            </SelectItem>
            <SelectItem value="living">{dict.common.living}</SelectItem>
            <SelectItem value="deceased">{dict.common.deceased}</SelectItem>
          </SelectContent>
        </Select>
        <Select dir={dir} value={generation} onValueChange={setGeneration}>
          <SelectTrigger
            className="h-10 w-full bg-card lg:w-40"
            aria-label={dict.directory.generation}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.directory.anyGeneration}</SelectItem>
            {generations.map((g) => (
              <SelectItem key={g} value={String(g)}>
                {format(dict.member.generation, { n: g })}
              </SelectItem>
            ))}
            <SelectItem value="inlaw">{dict.directory.inLaw}</SelectItem>
          </SelectContent>
        </Select>
        <Select dir={dir} value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-10 w-full bg-card lg:w-40" aria-label={dict.directory.sort}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="generation">
              {dict.directory.sort}: {dict.directory.sortGeneration}
            </SelectItem>
            <SelectItem value="name">
              {dict.directory.sort}: {dict.directory.sortName}
            </SelectItem>
            <SelectItem value="birth">
              {dict.directory.sort}: {dict.directory.sortBirth}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {format(dict.directory.results, { count: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={dict.directory.empty}
          action={
            <Button variant="outline" onClick={handleReset}>
              {dict.common.reset}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, limit).map((row) => (
            <li key={row.id}>
              <Link
                href={`/members/${row.id}`}
                className="group flex h-full items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Avatar
                  className={cn(
                    "size-11 border-2",
                    row.gender === "male" ? "border-male/60" : "border-female/60",
                  )}
                >
                  {row.photoUrl && <AvatarImage src={row.photoUrl} alt="" loading="lazy" />}
                  <AvatarFallback className="font-semibold">{initials(row.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.lineage}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {row.generation !== null ? (
                      <Badge variant="secondary" className="text-[11px]">
                        {format(dict.member.generation, { n: row.generation })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px]">
                        {dict.directory.inLaw}
                      </Badge>
                    )}
                    {row.birthYear && (
                      <Badge variant="outline" dir="ltr" className="text-[11px] tabular-nums">
                        {row.birthYear}
                        {row.deathYear ? ` – ${row.deathYear}` : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {filtered.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
            {dict.common.viewAll} ({filtered.length - limit})
          </Button>
        </div>
      )}
    </div>
  );
};
