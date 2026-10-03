import type { FamilyData, Member } from "./types";

export interface FamilyIndex {
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  spouses: Map<string, string[]>;
}

const indexCache = new WeakMap<FamilyData, FamilyIndex>();

const push = (map: Map<string, string[]>, key: string, value: string) => {
  const list = map.get(key);
  if (!list) {
    map.set(key, [value]);
    return;
  }
  if (!list.includes(value)) list.push(value);
};

/** Adjacency index for O(1) relative lookups. Cached per dataset object (datasets are immutable). */
export const getIndex = (data: FamilyData): FamilyIndex => {
  const cached = indexCache.get(data);
  if (cached) return cached;

  const index: FamilyIndex = { parents: new Map(), children: new Map(), spouses: new Map() };
  for (const rel of data.relationships) {
    if (!data.members[rel.fromId] || !data.members[rel.toId]) continue;
    if (rel.type === "parent") {
      push(index.parents, rel.toId, rel.fromId);
      push(index.children, rel.fromId, rel.toId);
      continue;
    }
    push(index.spouses, rel.fromId, rel.toId);
    push(index.spouses, rel.toId, rel.fromId);
  }
  const byBirth = (a: string, b: string) => compareMembers(data.members[a], data.members[b]);
  for (const list of index.children.values()) list.sort(byBirth);
  indexCache.set(data, index);
  return index;
};

/** Oldest first, unknown birth years last, then by name. */
export const compareMembers = (a?: Member, b?: Member): number => {
  const ay = a?.birthYear ?? Number.POSITIVE_INFINITY;
  const by = b?.birthYear ?? Number.POSITIVE_INFINITY;
  if (ay !== by) return ay - by;
  return (a?.name ?? "").localeCompare(b?.name ?? "", "ar");
};

export const getParentIds = (data: FamilyData, id: string) => getIndex(data).parents.get(id) ?? [];
export const getChildIds = (data: FamilyData, id: string) => getIndex(data).children.get(id) ?? [];
export const getSpouseIds = (data: FamilyData, id: string) => getIndex(data).spouses.get(id) ?? [];

export const getFatherId = (data: FamilyData, id: string) =>
  getParentIds(data, id).find((p) => data.members[p]?.gender === "male");
export const getMotherId = (data: FamilyData, id: string) =>
  getParentIds(data, id).find((p) => data.members[p]?.gender === "female");

/** Full and half siblings (share at least one parent), oldest first. */
export const getSiblingIds = (data: FamilyData, id: string): string[] => {
  const result = new Set<string>();
  for (const parentId of getParentIds(data, id)) {
    for (const childId of getChildIds(data, parentId)) {
      if (childId !== id) result.add(childId);
    }
  }
  return [...result].sort((a, b) => compareMembers(data.members[a], data.members[b]));
};

const walk = (start: string, next: (id: string) => string[]): Set<string> => {
  const seen = new Set<string>();
  const stack = [...next(start)];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || id === start) continue;
    seen.add(id);
    stack.push(...next(id));
  }
  return seen;
};

export const getAncestorIds = (data: FamilyData, id: string) =>
  walk(id, (x) => getParentIds(data, x));
export const getDescendantIds = (data: FamilyData, id: string) =>
  walk(id, (x) => getChildIds(data, x));

export const isAncestor = (data: FamilyData, ancestorId: string, personId: string) =>
  getAncestorIds(data, personId).has(ancestorId);

export const isLiving = (m: Member) => !m.isDeceased && !m.deathYear;

/**
 * The root of the displayed tree. Uses the configured root when valid, otherwise
 * the parentless member with the largest number of descendants.
 */
export const resolveRootId = (data: FamilyData): string | null => {
  if (data.rootId && data.members[data.rootId]) return data.rootId;
  let best: string | null = null;
  let bestCount = -1;
  for (const id of Object.keys(data.members)) {
    if (getParentIds(data, id).length > 0) continue;
    const count = getDescendantIds(data, id).size;
    if (count > bestCount || (count === bestCount && data.members[id].gender === "male")) {
      best = id;
      bestCount = count;
    }
  }
  return best;
};

/** Generation number for each blood-line member reachable from the root (root = 1). */
export const getGenerations = (data: FamilyData, rootId = resolveRootId(data)) => {
  const generation = new Map<string, number>();
  if (!rootId) return generation;
  const queue: string[] = [rootId];
  generation.set(rootId, 1);
  while (queue.length) {
    const id = queue.shift()!;
    const g = generation.get(id)!;
    for (const child of getChildIds(data, id)) {
      if (generation.has(child)) continue;
      generation.set(child, g + 1);
      queue.push(child);
    }
  }
  return generation;
};

/**
 * Patrilineal chain (person, father, grandfather, ...) used for the traditional
 * "نسب" full name. Falls back to the mother when the father is unknown.
 */
export const getLineage = (data: FamilyData, id: string, maxDepth = 12): Member[] => {
  const chain: Member[] = [];
  const seen = new Set<string>();
  let current: string | undefined = id;
  while (current && !seen.has(current) && chain.length <= maxDepth) {
    const member: Member | undefined = data.members[current];
    if (!member) break;
    chain.push(member);
    seen.add(current);
    current = getFatherId(data, current) ?? getMotherId(data, current);
  }
  return chain;
};

export const formatLineage = (chain: Member[], locale: "ar" | "en", depth = 4): string => {
  const parts = chain.slice(0, depth + 1);
  if (!parts.length) return "";
  return parts.reduce((acc, member, i) => {
    if (i === 0) return member.name;
    const child = parts[i - 1];
    const connector =
      locale === "ar"
        ? child.gender === "female"
          ? " بنت "
          : " بن "
        : child.gender === "female"
          ? " bint "
          : " ibn ";
    return acc + connector + member.name;
  }, "");
};

/** Members connected to the root through blood or marriage. */
export const getConnectedIds = (data: FamilyData, rootId = resolveRootId(data)) => {
  const seen = new Set<string>();
  if (!rootId) return seen;
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...getParentIds(data, id), ...getChildIds(data, id), ...getSpouseIds(data, id));
  }
  return seen;
};

/**
 * Who is `otherId` to `id`? Returns a relation key (for i18n) for close relatives.
 */
export const describeRelation = (data: FamilyData, id: string, otherId: string) => {
  const other = data.members[otherId];
  if (!other) return null;
  const g = other.gender === "male" ? "M" : "F";
  if (getParentIds(data, id).includes(otherId)) return `parent${g}`;
  if (getChildIds(data, id).includes(otherId)) return `child${g}`;
  if (getSpouseIds(data, id).includes(otherId)) return `spouse${g}`;
  if (getSiblingIds(data, id).includes(otherId)) return `sibling${g}`;
  const grandparents = getParentIds(data, id).flatMap((p) => getParentIds(data, p));
  if (grandparents.includes(otherId)) return `grandparent${g}`;
  const grandchildren = getChildIds(data, id).flatMap((c) => getChildIds(data, c));
  if (grandchildren.includes(otherId)) return `grandchild${g}`;
  return null;
};
