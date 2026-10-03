"use client";

import type { ReactNode } from "react";
import { Maximize, Minus, Plus, ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Button } from "@family/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@family/ui/components/tooltip";
import { Kbd } from "@family/ui/components/kbd";
import type { FamilyTreeHandle } from "./family-tree-view";

const IconButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="left">{label}</TooltipContent>
  </Tooltip>
);

/** Floating zoom / expand controls used on top of <FamilyTreeView>. */
export const TreeControls = ({
  treeRef,
  onExpandAll,
  onCollapseAll,
  onSearch,
  className,
}: {
  treeRef: React.RefObject<FamilyTreeHandle | null>;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSearch?: () => void;
  className?: string;
}) => {
  const { dict } = useI18n();
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-xl border bg-card/95 p-1 shadow-sm backdrop-blur ${className ?? ""}`}
    >
      {onSearch && (
        <IconButton label={dict.common.search} onClick={onSearch}>
          <Search />
        </IconButton>
      )}
      <IconButton label={dict.tree.zoomIn} onClick={() => treeRef.current?.zoomIn()}>
        <Plus />
      </IconButton>
      <IconButton label={dict.tree.zoomOut} onClick={() => treeRef.current?.zoomOut()}>
        <Minus />
      </IconButton>
      <IconButton label={dict.tree.fit} onClick={() => treeRef.current?.fit()}>
        <Maximize />
      </IconButton>
      <div className="mx-1 my-0.5 h-px bg-border" />
      <IconButton label={dict.tree.expandAll} onClick={onExpandAll}>
        <ChevronsUpDown />
      </IconButton>
      <IconButton label={dict.tree.collapseAll} onClick={onCollapseAll}>
        <ChevronsDownUp />
      </IconButton>
    </div>
  );
};

export const SearchTrigger = ({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) => {
  const { dict } = useI18n();
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`h-9 justify-start gap-2 bg-card/95 text-muted-foreground shadow-sm backdrop-blur ${className ?? ""}`}
    >
      <Search />
      <span className="truncate">{dict.tree.search}</span>
      <Kbd className="ms-auto hidden sm:inline-flex">/</Kbd>
    </Button>
  );
};
