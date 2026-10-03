import { hierarchy, tree, type HierarchyPointNode } from "d3-hierarchy";
import { getChildIds, getGenerations, getParentIds, getSpouseIds, resolveRootId } from "./graph";
import type { FamilyData, TreeDirection } from "./types";

export interface LayoutOptions {
  rootId?: string | null;
  direction?: TreeDirection;
  /** Mirror horizontally so the eldest sibling is on the right (Arabic reading order). */
  rtl?: boolean;
  showSpouses?: boolean;
  /** Blood-line members whose descendants are hidden. */
  collapsed?: ReadonlySet<string>;
  cardWidth?: number;
  cardHeight?: number;
  siblingGap?: number;
  cousinGap?: number;
  levelGap?: number;
  spouseGap?: number;
  linkStyle?: "elbow" | "curved";
}

export interface LayoutNode {
  /** Unique render key (a person can appear twice, e.g. cousin marriages). */
  key: string;
  id: string;
  /** Card centre. */
  x: number;
  y: number;
  role: "blood" | "spouse";
  depth: number;
  /** For spouse cards: the blood-line partner they are drawn next to. */
  partnerId?: string;
  /** Spouse card for someone who also appears elsewhere in the tree as blood-line. */
  duplicate?: boolean;
  childCount: number;
  collapsed: boolean;
  hasHiddenParents: boolean;
}

export interface LayoutLink {
  key: string;
  kind: "parent" | "spouse";
  d: string;
  sourceId: string;
  targetId: string;
}

export interface TreeLayout {
  rootId: string | null;
  nodes: LayoutNode[];
  links: LayoutLink[];
  /** Preferred (blood-line) card position per member id. */
  positions: Map<string, LayoutNode>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  cardWidth: number;
  cardHeight: number;
  generations: number;
}

interface Unit {
  id: string;
  spouses: string[];
  /** Children grouped by the other parent: index into `spouses`, or -1 when unknown. */
  groups: { spouseIndex: number; units: Unit[] }[];
  children: Unit[];
  width: number;
}

export const DEFAULT_CARD = { width: 188, height: 76 };

export const layoutFamilyTree = (data: FamilyData, options: LayoutOptions = {}): TreeLayout => {
  const {
    direction = "top-down",
    rtl = false,
    showSpouses = true,
    collapsed = new Set<string>(),
    cardWidth = DEFAULT_CARD.width,
    cardHeight = DEFAULT_CARD.height,
    siblingGap = 28,
    cousinGap = 56,
    levelGap = 96,
    spouseGap = 20,
    linkStyle = "elbow",
  } = options;
  const rootId =
    options.rootId && data.members[options.rootId] ? options.rootId : resolveRootId(data);

  const empty: TreeLayout = {
    rootId,
    nodes: [],
    links: [],
    positions: new Map(),
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
    cardWidth,
    cardHeight,
    generations: 0,
  };
  if (!rootId) return empty;

  const claimed = new Set<string>();
  const unitWidth = (spouseCount: number) =>
    cardWidth * (1 + spouseCount) + spouseGap * spouseCount;

  const buildUnit = (id: string): Unit => {
    const spouses = showSpouses ? getSpouseIds(data, id).filter((s) => s !== id) : [];
    const unit: Unit = { id, spouses, groups: [], children: [], width: unitWidth(spouses.length) };
    if (collapsed.has(id)) return unit;

    const kids = getChildIds(data, id).filter((c) => !claimed.has(c));
    // Claim all kids before recursing so each person is placed at their shallowest position.
    kids.forEach((k) => claimed.add(k));

    const byGroup = new Map<number, string[]>();
    for (const kid of kids) {
      const parents = getParentIds(data, kid);
      const spouseIndex = spouses.findIndex((s) => parents.includes(s));
      const list = byGroup.get(spouseIndex) ?? [];
      list.push(kid);
      byGroup.set(spouseIndex, list);
    }
    const order = [...byGroup.keys()].sort((a, b) => (a === -1 ? 1 : b === -1 ? -1 : a - b));
    for (const spouseIndex of order) {
      const units = byGroup.get(spouseIndex)!.map(buildUnit);
      unit.groups.push({ spouseIndex, units });
      unit.children.push(...units);
    }
    return unit;
  };

  claimed.add(rootId);
  const rootUnit = buildUnit(rootId);

  const levelStep = cardHeight + levelGap;
  const hier = hierarchy(rootUnit, (u) => (u.children.length ? u.children : null));
  const laidOut = tree<Unit>()
    .nodeSize([1, levelStep])
    .separation(
      (a, b) =>
        (a.data.width + b.data.width) / 2 + (a.parent === b.parent ? siblingGap : cousinGap),
    )(hier);

  const flipY = direction === "bottom-up" ? -1 : 1;
  const flipX = rtl ? -1 : 1;
  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];
  const positions = new Map<string, LayoutNode>();
  const bloodIds = new Set<string>();
  laidOut.each((n) => bloodIds.add(n.data.id));
  const half = cardHeight / 2;
  const halfW = cardWidth / 2;

  const unitCardX = (n: HierarchyPointNode<Unit>, index: number) => {
    const left = n.x - n.data.width / 2 + halfW;
    return (left + index * (cardWidth + spouseGap)) * flipX;
  };

  laidOut.each((n) => {
    const y = n.y * flipY;
    const personX = unitCardX(n, 0);
    const childCount = getChildIds(data, n.data.id).length;
    const person: LayoutNode = {
      key: `b:${n.data.id}`,
      id: n.data.id,
      x: personX,
      y,
      role: "blood",
      depth: n.depth,
      childCount,
      collapsed: collapsed.has(n.data.id) && childCount > 0,
      hasHiddenParents: n.depth === 0 && getParentIds(data, n.data.id).length > 0,
    };
    nodes.push(person);
    positions.set(person.id, person);

    const cardXs = [personX];
    n.data.spouses.forEach((spouseId, i) => {
      const sx = unitCardX(n, i + 1);
      cardXs.push(sx);
      nodes.push({
        key: `s:${n.data.id}:${spouseId}`,
        id: spouseId,
        x: sx,
        y,
        role: "spouse",
        depth: n.depth,
        partnerId: n.data.id,
        duplicate: bloodIds.has(spouseId),
        childCount: getChildIds(data, spouseId).length,
        collapsed: false,
        hasHiddenParents: getParentIds(data, spouseId).length > 0,
      });
      const prevX = cardXs[i];
      const x1 = prevX + Math.sign(sx - prevX) * halfW;
      const x2 = sx - Math.sign(sx - prevX) * halfW;
      links.push({
        key: `sp:${n.data.id}:${spouseId}`,
        kind: "spouse",
        d: `M${x1},${y}H${x2}`,
        sourceId: n.data.id,
        targetId: spouseId,
      });
    });

    const children = n.children ?? [];
    let childCursor = 0;
    n.data.groups.forEach((group, groupIndex) => {
      const isCouple = group.spouseIndex >= 0;
      const anchorX = isCouple
        ? (cardXs[group.spouseIndex] + cardXs[group.spouseIndex + 1]) / 2
        : personX;
      const anchorY = isCouple ? y : y + half * flipY;
      const midY = y + (half + levelGap / 2 + groupIndex * 6) * flipY;
      for (let i = 0; i < group.units.length; i += 1) {
        const child = children[childCursor];
        childCursor += 1;
        if (!child) continue;
        const cx = unitCardX(child, 0);
        const cy = child.y * flipY - half * flipY;
        const d =
          linkStyle === "curved"
            ? `M${anchorX},${anchorY}V${midY - 12 * flipY}C${anchorX},${midY} ${cx},${midY} ${cx},${midY + 12 * flipY}V${cy}`
            : `M${anchorX},${anchorY}V${midY}H${cx}V${cy}`;
        links.push({
          key: `p:${n.data.id}:${child.data.id}`,
          kind: "parent",
          d,
          sourceId: n.data.id,
          targetId: child.data.id,
        });
      }
    });
  });

  for (const node of nodes) {
    if (node.role === "spouse" && !positions.has(node.id)) positions.set(node.id, node);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x - halfW);
    maxX = Math.max(maxX, node.x + halfW);
    minY = Math.min(minY, node.y - half);
    maxY = Math.max(maxY, node.y + half);
  }

  return {
    rootId,
    nodes,
    links,
    positions,
    bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
    cardWidth,
    cardHeight,
    generations: laidOut.height + 1,
  };
};

/** Collapse every blood-line member at `depth` generations below the root (0 = none). */
export const collapseBeyondDepth = (
  data: FamilyData,
  depth: number,
  rootId = resolveRootId(data),
) => {
  const collapsed = new Set<string>();
  if (!depth || !rootId) return collapsed;
  for (const [id, generation] of getGenerations(data, rootId)) {
    if (generation >= depth && getChildIds(data, id).length > 0) collapsed.add(id);
  }
  return collapsed;
};

/** Ids to expand so that `id` becomes visible (its blood-line ancestors up to the root). */
export const pathToRoot = (data: FamilyData, id: string, rootId = resolveRootId(data)) => {
  const path: string[] = [];
  const seen = new Set<string>();
  const generations = getGenerations(data, rootId);
  let current: string | undefined = id;
  // A spouse is reached through their partner.
  if (current && !generations.has(current)) {
    current = getSpouseIds(data, current).find((s) => generations.has(s));
    if (current) path.push(current);
  }
  while (current && !seen.has(current) && current !== rootId) {
    seen.add(current);
    const parent = getParentIds(data, current).find((p) => generations.has(p));
    if (!parent) break;
    path.push(parent);
    current = parent;
  }
  return path;
};
