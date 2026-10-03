"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { flushSync } from "react-dom";
import { select } from "d3-selection";
import "d3-transition";
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import {
  getChildIds,
  getParentIds,
  isLiving,
  layoutFamilyTree,
  type FamilyData,
  type LayoutNode,
  type TreeDirection,
  type TreeLayout,
} from "@family/core";
import { TreeCard, type CardLod } from "./card";
import { serializeTreeSvg, svgToPngBlob } from "./export";

export interface FamilyTreeHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  centerOn: (id: string, options?: { scale?: number }) => void;
  exportSvg: () => string;
  exportPng: () => Promise<Blob>;
  getLayout: () => TreeLayout;
}

export interface FamilyTreeViewProps {
  data: FamilyData;
  rootId?: string | null;
  direction?: TreeDirection;
  rtl?: boolean;
  showSpouses?: boolean;
  showYears?: boolean;
  showPhotos?: boolean;
  /** Hide years/photos of living people (public privacy mode). */
  hideLivingDetails?: boolean;
  collapsed: ReadonlySet<string>;
  onToggleCollapse?: (id: string) => void;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Double-click / Enter on a selected card. */
  onActivate?: (id: string) => void;
  /** Ids to emphasise (e.g. lineage); others are dimmed. */
  highlightIds?: ReadonlySet<string> | null;
  getBadge?: (id: string) => "error" | "warning" | "info" | null;
  labels: {
    collapse: string;
    expand: string;
    marriedIn: string;
    deceased: string;
    treeLabel: string;
  };
  showMinimap?: boolean;
  className?: string;
}

const LITE_BELOW = 0.42;
const MIN_FIT_SCALE = 0.45;
const CULL_MARGIN = 300;
const QUANTUM = 160;

interface ViewState {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  lod: CardLod;
}

const computeView = (t: ZoomTransform, width: number, height: number): ViewState => {
  const q = (v: number, dir: 1 | -1) =>
    (dir === 1 ? Math.ceil(v / QUANTUM) : Math.floor(v / QUANTUM)) * QUANTUM;
  return {
    minX: q((0 - t.x) / t.k - CULL_MARGIN, -1),
    minY: q((0 - t.y) / t.k - CULL_MARGIN, -1),
    maxX: q((width - t.x) / t.k + CULL_MARGIN, 1),
    maxY: q((height - t.y) / t.k + CULL_MARGIN, 1),
    lod: t.k < LITE_BELOW ? "lite" : "full",
  };
};

const sameView = (a: ViewState | null, b: ViewState) =>
  !!a &&
  a.minX === b.minX &&
  a.minY === b.minY &&
  a.maxX === b.maxX &&
  a.maxY === b.maxY &&
  a.lod === b.lod;

export const FamilyTreeView = forwardRef<FamilyTreeHandle, FamilyTreeViewProps>(
  function FamilyTreeView(
    {
      data,
      rootId,
      direction = "top-down",
      rtl = false,
      showSpouses = true,
      showYears = true,
      showPhotos = true,
      hideLivingDetails = false,
      collapsed,
      onToggleCollapse,
      selectedId = null,
      onSelect,
      onActivate,
      highlightIds,
      getBadge,
      labels,
      showMinimap = true,
      className,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const viewportRef = useRef<SVGGElement>(null);
    const minimapViewRef = useRef<SVGRectElement>(null);
    const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const transformRef = useRef<ZoomTransform>(zoomIdentity);
    const sizeRef = useRef({ width: 0, height: 0 });
    const frameRef = useRef<number | null>(null);
    const didInitialFit = useRef(false);
    const [view, setView] = useState<ViewState | null>(null);
    const [exporting, setExporting] = useState(false);

    const layout = useMemo(
      () => layoutFamilyTree(data, { rootId, direction, rtl, showSpouses, collapsed }),
      [data, rootId, direction, rtl, showSpouses, collapsed],
    );
    const layoutRef = useRef(layout);
    layoutRef.current = layout;

    const updateMinimap = useCallback(() => {
      const rect = minimapViewRef.current;
      if (!rect) return;
      const t = transformRef.current;
      const { width, height } = sizeRef.current;
      rect.setAttribute("x", String(-t.x / t.k));
      rect.setAttribute("y", String(-t.y / t.k));
      rect.setAttribute("width", String(width / t.k));
      rect.setAttribute("height", String(height / t.k));
    }, []);

    const scheduleCull = useCallback(() => {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const next = computeView(
          transformRef.current,
          sizeRef.current.width,
          sizeRef.current.height,
        );
        setView((prev) => (sameView(prev, next) ? prev : next));
        updateMinimap();
      });
    }, [updateMinimap]);

    // Zoom/pan: transform is applied directly to the DOM, React only re-renders when the
    // culled viewport (quantised) or level-of-detail changes.
    useEffect(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const behavior = d3zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.08, 2.5])
        .on("zoom", (event: { transform: ZoomTransform }) => {
          transformRef.current = event.transform;
          viewportRef.current?.setAttribute("transform", event.transform.toString());
          scheduleCull();
        });
      zoomRef.current = behavior;
      select(svg).call(behavior).on("dblclick.zoom", null);
      return () => {
        select(svg).on(".zoom", null);
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }, [scheduleCull]);

    const applyTransform = useCallback((t: ZoomTransform, animate = true) => {
      const svg = svgRef.current;
      const behavior = zoomRef.current;
      if (!svg || !behavior) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (animate && !reduced) select(svg).transition().duration(450).call(behavior.transform, t);
      else select(svg).call(behavior.transform, t);
    }, []);

    const fit = useCallback(
      (animate = true) => {
        const { width, height } = sizeRef.current;
        const b = layoutRef.current.bounds;
        if (!width || !height || !layoutRef.current.nodes.length) return;
        const pad = 48;
        const fitK = Math.min((width - pad * 2) / b.width, (height - pad * 2) / b.height);
        // Large trees on small screens: don't shrink cards into unreadable specks. Show the
        // root generation at a legible scale instead and let the user pan from there.
        if (fitK < MIN_FIT_SCALE) {
          const { rootId, positions } = layoutRef.current;
          const root = rootId ? positions.get(rootId) : undefined;
          const k = MIN_FIT_SCALE;
          const anchorX = root?.x ?? b.minX + b.width / 2;
          const y = direction === "bottom-up" ? height - pad - b.maxY * k : pad + 40 - b.minY * k;
          applyTransform(zoomIdentity.translate(width / 2 - anchorX * k, y).scale(k), animate);
          return;
        }
        const k = Math.min(1.1, fitK);
        const x = width / 2 - (b.minX + b.width / 2) * k;
        const y = height / 2 - (b.minY + b.height / 2) * k;
        applyTransform(zoomIdentity.translate(x, y).scale(k), animate);
      },
      [applyTransform, direction],
    );

    const centerOn = useCallback(
      (id: string, options: { scale?: number } = {}) => {
        const node = layoutRef.current.positions.get(id);
        if (!node) return;
        const { width, height } = sizeRef.current;
        const k = options.scale ?? Math.max(transformRef.current.k, 0.8);
        applyTransform(
          zoomIdentity.translate(width / 2 - node.x * k, height / 2 - node.y * k).scale(k),
        );
      },
      [applyTransform],
    );

    // Track container size.
    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new ResizeObserver(([entry]) => {
        sizeRef.current = { width: entry.contentRect.width, height: entry.contentRect.height };
        if (
          !didInitialFit.current &&
          entry.contentRect.width > 0 &&
          layoutRef.current.nodes.length
        ) {
          didInitialFit.current = true;
          if (selectedId && layoutRef.current.positions.has(selectedId))
            centerOn(selectedId, { scale: 0.9 });
          else fit(false);
        }
        scheduleCull();
      });
      observer.observe(el);
      return () => observer.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!didInitialFit.current && sizeRef.current.width && layout.nodes.length) {
        didInitialFit.current = true;
        fit(false);
      }
      scheduleCull();
    }, [layout, fit, scheduleCull]);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () =>
          svgRef.current &&
          zoomRef.current &&
          select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.3),
        zoomOut: () =>
          svgRef.current &&
          zoomRef.current &&
          select(svgRef.current)
            .transition()
            .duration(250)
            .call(zoomRef.current.scaleBy, 1 / 1.3),
        fit: () => fit(true),
        centerOn,
        getLayout: () => layoutRef.current,
        exportSvg: () => {
          flushSync(() => setExporting(true));
          try {
            return serializeTreeSvg(svgRef.current!, layoutRef.current.bounds).markup;
          } finally {
            setExporting(false);
          }
        },
        exportPng: async () => {
          flushSync(() => setExporting(true));
          let result: ReturnType<typeof serializeTreeSvg>;
          try {
            result = serializeTreeSvg(svgRef.current!, layoutRef.current.bounds);
          } finally {
            setExporting(false);
          }
          return svgToPngBlob(result.markup, result.width, result.height);
        },
      }),
      [centerOn, fit],
    );

    const visibleNodes = useMemo(() => {
      if (exporting || !view) return layout.nodes;
      const hw = layout.cardWidth / 2;
      const hh = layout.cardHeight / 2;
      return layout.nodes.filter(
        (n) =>
          n.x + hw >= view.minX &&
          n.x - hw <= view.maxX &&
          n.y + hh >= view.minY &&
          n.y - hh <= view.maxY,
      );
    }, [layout, view, exporting]);

    const linkPaths = useMemo(() => {
      let parent = "";
      let spouse = "";
      let highlighted = "";
      for (const link of layout.links) {
        const lit = highlightIds?.has(link.sourceId) && highlightIds.has(link.targetId);
        if (lit) highlighted += link.d;
        else if (link.kind === "parent") parent += link.d;
        else spouse += link.d;
      }
      return { parent, spouse, highlighted };
    }, [layout, highlightIds]);

    const minimapPath = useMemo(
      () =>
        layout.nodes
          .map(
            (n) =>
              `M${n.x - layout.cardWidth / 2},${n.y - layout.cardHeight / 2}h${layout.cardWidth}v${layout.cardHeight}h${-layout.cardWidth}z`,
          )
          .join(""),
      [layout],
    );

    const focusKey = useMemo(() => {
      if (selectedId) {
        const node = layout.positions.get(selectedId);
        if (node) return node.key;
      }
      return layout.nodes[0]?.key;
    }, [layout, selectedId]);

    const handleSelect = useCallback((id: string) => onSelect?.(id), [onSelect]);
    const handleBackgroundClick = () => onSelect?.(null);

    const moveSelection = (id: string | undefined) => {
      if (!id || !layout.positions.has(id)) return;
      onSelect?.(id);
      centerOn(id);
      requestAnimationFrame(() => {
        const key = layout.positions.get(id)?.key;
        svgRef.current
          ?.querySelector<SVGGElement>(`[data-node-key="${CSS.escape(key ?? "")}"]`)
          ?.focus({ preventScroll: true });
      });
    };

    const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
      const current = selectedId ?? layout.rootId;
      if (!current) return;
      const up = direction === "top-down" ? "ArrowUp" : "ArrowDown";
      const down = direction === "top-down" ? "ArrowDown" : "ArrowUp";
      const siblingsInRow = (node: LayoutNode | undefined) =>
        node ? layout.nodes.filter((n) => n.y === node.y).sort((a, b) => a.x - b.x) : [];

      if (event.key === up) {
        event.preventDefault();
        moveSelection(getParentIds(data, current).find((p) => layout.positions.has(p)));
        return;
      }
      if (event.key === down) {
        event.preventDefault();
        moveSelection(getChildIds(data, current).find((c) => layout.positions.has(c)));
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const node = layout.positions.get(current);
        const row = siblingsInRow(node);
        const index = row.findIndex((n) => n.key === node?.key);
        const next = row[index + (event.key === "ArrowRight" ? 1 : -1)];
        moveSelection(next?.id);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        if (svgRef.current && zoomRef.current)
          select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 1.3);
      }
      if (event.key === "-") {
        event.preventDefault();
        if (svgRef.current && zoomRef.current)
          select(svgRef.current)
            .transition()
            .duration(200)
            .call(zoomRef.current.scaleBy, 1 / 1.3);
      }
      if (event.key === "0") {
        event.preventDefault();
        fit(true);
      }
      if (event.key === "Escape") onSelect?.(null);
    };

    const handleMinimapClick = (event: React.MouseEvent<SVGSVGElement>) => {
      event.stopPropagation();
      const svg = event.currentTarget;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const { x, y } = point.matrixTransform(ctm.inverse());
      const { width, height } = sizeRef.current;
      const k = transformRef.current.k;
      applyTransform(zoomIdentity.translate(width / 2 - x * k, height / 2 - y * k).scale(k));
    };

    const lod: CardLod = exporting ? "full" : (view?.lod ?? "full");
    const b = layout.bounds;
    const minimapPad = 80;

    return (
      <div
        ref={containerRef}
        className={`relative h-full w-full overflow-hidden bg-tree-canvas ${className ?? ""}`}
      >
        <svg
          ref={svgRef}
          role="tree"
          aria-label={labels.treeLabel}
          className="block h-full w-full touch-none select-none"
          onClick={handleBackgroundClick}
          onKeyDown={handleKeyDown}
        >
          <defs>
            <clipPath id="ft-avatar-clip" clipPathUnits="objectBoundingBox">
              <circle cx="0.5" cy="0.5" r="0.5" />
            </clipPath>
            <pattern id="ft-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
          </defs>
          <rect data-export-ignore width="100%" height="100%" fill="url(#ft-dots)" />
          <g ref={viewportRef} data-viewport transform={transformRef.current.toString()}>
            <path
              d={linkPaths.parent}
              fill="none"
              stroke="var(--tree-link)"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            <path
              d={linkPaths.spouse}
              fill="none"
              stroke="var(--tree-link)"
              strokeWidth={1.6}
              strokeDasharray="4 3"
            />
            {linkPaths.highlighted && (
              <path
                d={linkPaths.highlighted}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={2.6}
                strokeLinejoin="round"
              />
            )}
            {visibleNodes.map((node) => {
              const member = data.members[node.id];
              if (!member) return null;
              const highlighted = !!highlightIds?.has(node.id);
              return (
                <TreeCard
                  key={node.key}
                  nodeKey={node.key}
                  member={member}
                  x={node.x}
                  y={node.y}
                  width={layout.cardWidth}
                  height={layout.cardHeight}
                  role={node.role}
                  duplicate={node.duplicate}
                  selected={selectedId === node.id}
                  focusable={focusKey === node.key}
                  dimmed={!!highlightIds && highlightIds.size > 0 && !highlighted}
                  highlighted={highlighted}
                  collapsed={node.collapsed}
                  childCount={node.childCount}
                  rtl={rtl}
                  lod={lod}
                  showYears={showYears}
                  showPhoto={showPhotos && !exporting}
                  hideDetails={hideLivingDetails && isLiving(member)}
                  badge={getBadge?.(node.id) ?? null}
                  direction={direction}
                  labels={labels}
                  onSelect={handleSelect}
                  onToggle={onToggleCollapse}
                  onActivate={onActivate}
                />
              );
            })}
          </g>
        </svg>
        {showMinimap && layout.nodes.length > 12 && (
          <svg
            aria-hidden
            data-export-ignore
            className="absolute bottom-3 hidden h-28 w-44 cursor-pointer rounded-lg border bg-card/90 shadow-sm backdrop-blur ltr:right-3 rtl:left-3 md:block"
            viewBox={`${b.minX - minimapPad} ${b.minY - minimapPad} ${b.width + minimapPad * 2} ${b.height + minimapPad * 2}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={handleMinimapClick}
          >
            <path d={minimapPath} fill="var(--muted-foreground)" opacity={0.45} />
            <rect
              ref={minimapViewRef}
              fill="var(--primary)"
              fillOpacity={0.08}
              stroke="var(--primary)"
              strokeWidth={Math.max(b.width, b.height) / 120}
            />
          </svg>
        )}
      </div>
    );
  },
);
