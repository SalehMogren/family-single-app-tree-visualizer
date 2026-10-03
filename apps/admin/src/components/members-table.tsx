"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowDownUp,
  GitBranch,
  MoreHorizontal,
  Network,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  addMember,
  formatLineage,
  getChildIds,
  getGenerations,
  getLineage,
  getParentIds,
  getSpouseIds,
  isLiving,
  normalizeText,
  resolveRootId,
  type RelationKind,
} from "@family/core";
import { format } from "@family/i18n";
import { useI18n } from "@family/i18n/react";
import { Badge } from "@family/ui/components/badge";
import { Button } from "@family/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@family/ui/components/dropdown-menu";
import { Input } from "@family/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@family/ui/components/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@family/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@family/ui/components/table";
import { cn } from "@family/ui/lib/utils";
import { useFamilyStore } from "@/lib/family-store";
import { useMutate } from "@/lib/use-mutation";
import { AddRelativeDialog, type AddRelativeRequest } from "./add-relative-dialog";
import { DeleteMemberDialog } from "./delete-member-dialog";
import { MemberForm } from "./member-form";
import { MemberPanel } from "./member-panel";

const PAGE_SIZE = 25;
type SortKey = "name" | "birth" | "generation";

const SortButton = ({
  k,
  label,
  active,
  onToggle,
}: {
  k: SortKey;
  label: string;
  active: boolean;
  onToggle: (k: SortKey) => void;
}) => (
  <button
    type="button"
    onClick={() => onToggle(k)}
    className="inline-flex items-center gap-1 hover:text-foreground"
  >
    {label}
    <ArrowDownUp className={cn("size-3", active ? "opacity-100" : "opacity-30")} />
  </button>
);

export const MembersTable = () => {
  const { dict, locale, dir } = useI18n();
  const data = useFamilyStore((s) => s.data);
  const mutate = useMutate();
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "generation",
    asc: true,
  });
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addRequest, setAddRequest] = useState<AddRelativeRequest | null>(null);
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(() => {
    const generations = getGenerations(data, resolveRootId(data));
    return Object.values(data.members).map((m) => {
      const lineage = formatLineage(getLineage(data, m.id), locale, 3);
      return {
        member: m,
        lineage,
        haystack: normalizeText(`${lineage} ${m.occupation ?? ""} ${m.nickname ?? ""}`),
        generation: generations.get(m.id) ?? null,
        parents: getParentIds(data, m.id).length,
        spouses: getSpouseIds(data, m.id).length,
        children: getChildIds(data, m.id).length,
        living: isLiving(m),
      };
    });
  }, [data, locale]);

  const filtered = useMemo(() => {
    const q = normalizeText(deferredQuery);
    const dirFactor = sort.asc ? 1 : -1;
    return rows
      .filter(
        (r) => (!q || r.haystack.includes(q)) && (gender === "all" || r.member.gender === gender),
      )
      .filter((r) => status === "all" || (status === "living" ? r.living : !r.living))
      .sort((a, b) => {
        if (sort.key === "name") return a.lineage.localeCompare(b.lineage, locale) * dirFactor;
        if (sort.key === "birth")
          return ((a.member.birthYear ?? 9999) - (b.member.birthYear ?? 9999)) * dirFactor;
        return (
          ((a.generation ?? 99) - (b.generation ?? 99) ||
            (a.member.birthYear ?? 9999) - (b.member.birthYear ?? 9999)) * dirFactor
        );
      });
  }, [rows, deferredQuery, gender, status, sort, locale]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, asc: s.key === key ? !s.asc : true }));
  const handleCreate = (input: Parameters<typeof addMember>[1]) => {
    let id = "";
    mutate(
      (d) => {
        const result = addMember(d, input);
        id = result.member.id;
        return result.data;
      },
      { action: "member.create", summary: input.name },
      format(dict.admin.editor.memberAdded, { name: input.name }),
    );
    setCreating(false);
    if (id) setEditingId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={dict.common.searchPlaceholder}
          aria-label={dict.common.search}
          className="sm:max-w-xs"
        />
        <Select
          dir={dir}
          value={gender}
          onValueChange={(v) => {
            setGender(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-36" aria-label={dict.member.gender}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {dict.member.gender}: {dict.common.all}
            </SelectItem>
            <SelectItem value="male">{dict.common.male}</SelectItem>
            <SelectItem value="female">{dict.common.female}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          dir={dir}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-40" aria-label={dict.directory.status}>
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
        <Button className="sm:ms-auto" onClick={() => setCreating(true)}>
          <Plus /> {dict.admin.members.add}
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">
                <SortButton
                  k="name"
                  active={sort.key === "name"}
                  onToggle={toggleSort}
                  label={dict.admin.members.columns.name}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  k="generation"
                  active={sort.key === "generation"}
                  onToggle={toggleSort}
                  label={dict.admin.members.columns.generation}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  k="birth"
                  active={sort.key === "birth"}
                  onToggle={toggleSort}
                  label={dict.admin.members.columns.years}
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {dict.admin.members.columns.relatives}
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {dict.admin.members.columns.status}
              </TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{dict.common.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {dict.admin.members.noResults}
                </TableCell>
              </TableRow>
            )}
            {visible.map((r) => (
              <TableRow
                key={r.member.id}
                className="cursor-pointer"
                onClick={() => setEditingId(r.member.id)}
              >
                <TableCell className="max-w-72 ps-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        r.member.gender === "male" ? "bg-male" : "bg-female",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.member.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.lineage}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {r.generation ? (
                    <Badge variant="secondary">{r.generation}</Badge>
                  ) : (
                    <Badge variant="outline">{dict.directory.inLaw}</Badge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums" dir="ltr">
                  <span className="block text-start">
                    {r.member.birthYear ?? "—"}
                    {r.member.deathYear ? ` – ${r.member.deathYear}` : ""}
                  </span>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {format(dict.admin.members.relationsSummary, {
                    parents: r.parents,
                    spouses: r.spouses,
                    children: r.children,
                  })}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    variant="outline"
                    className={
                      r.living ? "border-transparent bg-success/15 text-success" : undefined
                    }
                  >
                    {r.living
                      ? dict.common.living
                      : r.member.gender === "female"
                        ? dict.common.deceasedF
                        : dict.common.deceased}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu dir={dir}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={dict.common.actions}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditingId(r.member.id)}>
                        <Pencil /> {dict.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/editor?focus=${r.member.id}`}>
                          <Network /> {dict.tree.showInTree}
                        </Link>
                      </DropdownMenuItem>
                      {r.children > 0 && (
                        <DropdownMenuItem asChild>
                          <Link href={`/editor?root=${r.member.id}&focus=${r.member.id}`}>
                            <GitBranch /> {dict.tree.focusView}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteId(r.member.id)}
                      >
                        <Trash2 /> {dict.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="tabular-nums">
          {format(dict.admin.members.rows, {
            from: filtered.length ? currentPage * PAGE_SIZE + 1 : 0,
            to: Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE),
            total: filtered.length,
          })}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            {dict.admin.members.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            {dict.admin.members.next}
          </Button>
        </div>
      </div>

      <Sheet
        open={!!editingId && !!data.members[editingId]}
        onOpenChange={(open) => !open && setEditingId(null)}
      >
        <SheetContent
          side="end"
          closeLabel={dict.common.close}
          className="w-full overflow-y-auto p-5 sm:max-w-lg"
        >
          <SheetTitle className="sr-only">
            {editingId ? data.members[editingId]?.name : ""}
          </SheetTitle>
          {editingId && (
            <MemberPanel
              key={editingId}
              memberId={editingId}
              onSelect={setEditingId}
              onAddRelative={(relation: RelationKind) =>
                setAddRequest({ targetId: editingId, relation })
              }
              onDelete={() => setDeleteId(editingId)}
              showTreeLink
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent
          side="end"
          closeLabel={dict.common.close}
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>{dict.admin.members.addTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <MemberForm
              submitLabel={dict.common.create}
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AddRelativeDialog
        request={addRequest}
        onOpenChange={(open) => !open && setAddRequest(null)}
      />
      <DeleteMemberDialog
        memberId={deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onDeleted={() => setEditingId(null)}
      />
    </div>
  );
};
