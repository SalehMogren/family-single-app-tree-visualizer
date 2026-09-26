"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileCode2,
  FileJson,
  Image as ImageIcon,
  SlidersHorizontal,
  TreePine,
} from "lucide-react";
import type { FamilyData, SiteSettings, TreeDirection } from "@family/core";
import { useI18n } from "@family/i18n/react";
import {
  FamilyTreeView,
  SearchTrigger,
  TreeControls,
  TreeSearch,
  downloadBlob,
  useTreeState,
  type FamilyTreeHandle,
} from "@family/tree";
import { Button } from "@family/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@family/ui/components/dropdown-menu";
import { EmptyState } from "@family/ui/components/empty-state";
import { Sheet, SheetContent, SheetTitle } from "@family/ui/components/sheet";
import { toast } from "@family/ui/components/sonner";
import { useMediaQuery } from "@family/ui/hooks/use-media-query";
import { PersonPanel } from "./person-panel";

export const TreeExplorer = ({
  data,
  settings,
  initialFocusId,
  fileName,
}: {
  data: FamilyData;
  settings: SiteSettings;
  initialFocusId: string | null;
  fileName: string;
}) => {
  const { dict, dir } = useI18n();
  const router = useRouter();
  const treeRef = useRef<FamilyTreeHandle>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [searchOpen, setSearchOpen] = useState(false);
  const [direction, setDirection] = useState<TreeDirection>(settings.tree.direction);
  const [showSpouses, setShowSpouses] = useState(settings.tree.showSpouses);
  const [showYears, setShowYears] = useState(settings.tree.showYears);
  const validFocus = initialFocusId && data.members[initialFocusId] ? initialFocusId : null;
  const tree = useTreeState(data, {
    initialDepth: settings.tree.initialDepth,
    initialSelectedId: validFocus,
  });
  const { selectedId, setSelectedId, reveal } = tree;

  const labels = useMemo(
    () => ({
      collapse: dict.tree.collapse,
      expand: dict.tree.expand,
      marriedIn: dict.tree.marriedIn,
      deceased: dict.common.deceased,
      treeLabel: dict.tree.title,
    }),
    [dict],
  );

  // Keep ?focus= in sync without triggering a navigation.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("focus", selectedId);
    else url.searchParams.delete("focus");
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  const focusPerson = useCallback(
    (id: string) => {
      reveal(id);
      setSelectedId(id);
      // Wait for the re-layout after revealing collapsed ancestors.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => treeRef.current?.centerOn(id, { scale: 1 })),
      );
    },
    [reveal, setSelectedId],
  );

  const handleSelect = useCallback((id: string | null) => setSelectedId(id), [setSelectedId]);
  const handleActivate = useCallback(
    (id: string) => {
      if (settings.features.directory) router.push(`/members/${id}`);
    },
    [router, settings.features.directory],
  );

  const handleExport = async (kind: "png" | "svg" | "json" | "gedcom") => {
    try {
      if (kind === "png") {
        const blob = await treeRef.current!.exportPng();
        downloadBlob(blob, `${fileName}.png`);
      }
      if (kind === "svg") {
        const markup = treeRef.current!.exportSvg();
        downloadBlob(new Blob([markup], { type: "image/svg+xml" }), `${fileName}.svg`);
      }
      if (kind === "json" || kind === "gedcom") {
        const response = await fetch(`/api/export?format=${kind}`);
        if (!response.ok) throw new Error(response.statusText);
        downloadBlob(await response.blob(), `${fileName}.${kind === "json" ? "json" : "ged"}`);
      }
      toast.success(dict.tree.exported);
    } catch {
      toast.error(dict.common.error);
    }
  };

  if (!Object.keys(data.members).length) {
    return (
      <div className="grid h-full place-items-center p-6">
        <EmptyState icon={<TreePine />} title={dict.tree.empty} description={dict.tree.emptyHint} />
      </div>
    );
  }

  const panel = selectedId && (
    <PersonPanel
      data={data}
      id={selectedId}
      onClose={() => setSelectedId(null)}
      onPick={focusPerson}
      highlightLineage={tree.highlightLineage}
      onHighlightLineageChange={tree.setHighlightLineage}
      showProfileLink={settings.features.directory}
      className={isDesktop ? "w-[22rem]" : "border-0 bg-transparent p-0 shadow-none"}
    />
  );

  return (
    <div className="relative h-full overflow-hidden">
      <FamilyTreeView
        ref={treeRef}
        data={data}
        rootId={tree.rootId}
        direction={direction}
        rtl={dir === "rtl"}
        showSpouses={showSpouses}
        showYears={showYears}
        showPhotos={settings.tree.showPhotos}
        hideLivingDetails={settings.privacy.hideLivingDetails}
        collapsed={tree.collapsed}
        onToggleCollapse={tree.toggleCollapse}
        selectedId={selectedId}
        onSelect={handleSelect}
        onActivate={handleActivate}
        highlightIds={tree.highlightIds}
        labels={labels}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start gap-2">
        <SearchTrigger
          onClick={() => setSearchOpen(true)}
          className="pointer-events-auto min-w-0 flex-1 sm:max-w-xs"
        />
        <DropdownMenu dir={dir}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto bg-card/95 shadow-sm backdrop-blur"
              aria-label={dict.tree.layout}
            >
              <SlidersHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>{dict.tree.direction}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={direction}
              onValueChange={(v) => setDirection(v as TreeDirection)}
            >
              <DropdownMenuRadioItem value="top-down">{dict.tree.topDown}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom-up">{dict.tree.bottomUp}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            {!settings.privacy.hideSpouses && (
              <DropdownMenuCheckboxItem checked={showSpouses} onCheckedChange={setShowSpouses}>
                {dict.tree.showSpouses}
              </DropdownMenuCheckboxItem>
            )}
            <DropdownMenuCheckboxItem checked={showYears} onCheckedChange={setShowYears}>
              {dict.tree.showYears}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {settings.features.export && (
          <DropdownMenu dir={dir}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="pointer-events-auto bg-card/95 shadow-sm backdrop-blur"
                aria-label={dict.common.export}
              >
                <Download />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => handleExport("png")}>
                <ImageIcon /> {dict.tree.exportPng}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("svg")}>
                <FileCode2 /> {dict.tree.exportSvg}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleExport("json")}>
                <FileJson /> {dict.tree.exportJson}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("gedcom")}>
                <FileJson /> {dict.tree.exportGedcom}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <TreeControls
        treeRef={treeRef}
        onExpandAll={tree.expandAll}
        onCollapseAll={tree.collapseAll}
        className="absolute end-3 top-16 md:top-3"
      />

      {isDesktop ? (
        panel && <div className="absolute end-16 top-3 max-h-[calc(100%-1.5rem)]">{panel}</div>
      ) : (
        <Sheet
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
          modal={false}
        >
          <SheetContent
            side="bottom"
            modal={false}
            closeLabel={dict.common.close}
            className="p-5"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <SheetTitle className="sr-only">
              {selectedId ? data.members[selectedId]?.name : ""}
            </SheetTitle>
            {panel}
          </SheetContent>
        </Sheet>
      )}

      <p className="pointer-events-none absolute bottom-3 hidden max-w-sm text-xs text-muted-foreground ltr:left-3 rtl:right-3 lg:block">
        {dict.tree.help}
      </p>

      <TreeSearch data={data} open={searchOpen} onOpenChange={setSearchOpen} onPick={focusPerson} />
    </div>
  );
};
