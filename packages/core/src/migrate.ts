import { familyDataSchema, type FamilyData, type Member, type Relationship } from "./types";

interface LegacyMember {
  id: string;
  name?: string;
  gender?: string;
  birth_year?: number;
  death_year?: number;
  occupation?: string;
  birthplace?: string;
  notes?: string;
  image?: string;
  imageUrl?: string;
}

interface LegacyRelationship {
  id?: string;
  fromId: string;
  toId: string;
  type: "parent" | "spouse" | "sibling" | string;
  metadata?: Relationship["metadata"];
}

interface LegacyData {
  members: Record<string, LegacyMember>;
  relationships?: LegacyRelationship[];
  mainId?: string;
}

const isLegacy = (raw: unknown): raw is LegacyData =>
  !!raw &&
  typeof raw === "object" &&
  "members" in raw &&
  !("schemaVersion" in raw) &&
  typeof (raw as LegacyData).members === "object";

const toMember = (m: LegacyMember): Member => {
  const photo = m.imageUrl || m.image;
  return {
    id: m.id,
    name: (m.name ?? "").trim() || "?",
    gender: m.gender === "female" ? "female" : "male",
    ...(m.birth_year ? { birthYear: m.birth_year } : {}),
    ...(m.death_year ? { deathYear: m.death_year, isDeceased: true } : {}),
    ...(m.occupation ? { occupation: m.occupation } : {}),
    ...(m.birthplace ? { birthplace: m.birthplace } : {}),
    ...(m.notes ? { bio: m.notes } : {}),
    ...(photo && /^https?:\/\//.test(photo) ? { photoUrl: photo } : {}),
  };
};

/**
 * Remove dangling, duplicate and impossible relationships so the rest of the
 * system can rely on invariants (<=1 father, <=1 mother, no cycles).
 */
export const sanitizeFamilyData = (data: FamilyData): { data: FamilyData; dropped: number } => {
  const seen = new Set<string>();
  const kept: Relationship[] = [];
  const fatherOf = new Map<string, string>();
  const motherOf = new Map<string, string>();
  let dropped = 0;

  const parentsOf = new Map<string, string[]>();
  const isAncestorOf = (candidate: string, person: string) => {
    const stack = [...(parentsOf.get(person) ?? [])];
    const visited = new Set<string>();
    while (stack.length) {
      const id = stack.pop()!;
      if (id === candidate) return true;
      if (visited.has(id)) continue;
      visited.add(id);
      stack.push(...(parentsOf.get(id) ?? []));
    }
    return false;
  };

  for (const rel of data.relationships) {
    const from = data.members[rel.fromId];
    const to = data.members[rel.toId];
    const key =
      rel.type === "spouse"
        ? `spouse:${[rel.fromId, rel.toId].sort().join(":")}`
        : `parent:${rel.fromId}:${rel.toId}`;
    if (!from || !to || rel.fromId === rel.toId || seen.has(key)) {
      dropped += 1;
      continue;
    }
    if (rel.type === "parent") {
      const slot = from.gender === "male" ? fatherOf : motherOf;
      // The child already has a parent of this gender, or the link would create a cycle.
      if (slot.has(rel.toId) || isAncestorOf(rel.toId, rel.fromId)) {
        dropped += 1;
        continue;
      }
      slot.set(rel.toId, rel.fromId);
      parentsOf.set(rel.toId, [...(parentsOf.get(rel.toId) ?? []), rel.fromId]);
    }
    seen.add(key);
    kept.push({ ...rel, id: key });
  }
  const rootId = data.rootId && data.members[data.rootId] ? data.rootId : null;
  return { data: { ...data, rootId, relationships: kept }, dropped };
};

export class ImportError extends Error {
  constructor(public issues: string[]) {
    super(`Invalid family data: ${issues.slice(0, 3).join("; ")}`);
    this.name = "ImportError";
  }
}

/**
 * Accept either the current format or the legacy v1 format (the original single app)
 * and return clean, validated data.
 */
export const parseFamilyData = (
  raw: unknown,
): { data: FamilyData; dropped: number; migrated: boolean } => {
  if (isLegacy(raw)) {
    const members: Record<string, Member> = {};
    for (const [id, m] of Object.entries(raw.members))
      members[id] = toMember({ ...m, id: m.id ?? id });
    const relationships: Relationship[] = [];
    const legacyRels = raw.relationships ?? [];
    for (const rel of legacyRels) {
      if (rel.type !== "parent" && rel.type !== "spouse") continue;
      relationships.push({
        id: rel.id ?? `${rel.type}:${rel.fromId}:${rel.toId}`,
        type: rel.type,
        fromId: rel.fromId,
        toId: rel.toId,
        ...(rel.metadata ? { metadata: rel.metadata } : {}),
      });
    }
    const base: FamilyData = {
      schemaVersion: 2,
      revision: 0,
      rootId: null,
      members,
      relationships,
      updatedAt: new Date().toISOString(),
    };
    // Legacy stored explicit sibling links; convert them into shared parents where possible.
    const { data } = sanitizeFamilyData(base);
    let withSiblings = data;
    for (const rel of legacyRels) {
      if (rel.type !== "sibling") continue;
      const parentsOf = (id: string) =>
        withSiblings.relationships
          .filter((r) => r.type === "parent" && r.toId === id)
          .map((r) => r.fromId);
      const [a, b] = [rel.fromId, rel.toId];
      const source = parentsOf(a).length ? a : b;
      const target = source === a ? b : a;
      if (!members[target] || parentsOf(target).length) continue;
      withSiblings = {
        ...withSiblings,
        relationships: [
          ...withSiblings.relationships,
          ...parentsOf(source).map((p) => ({
            id: `parent:${p}:${target}`,
            type: "parent" as const,
            fromId: p,
            toId: target,
          })),
        ],
      };
    }
    const final = sanitizeFamilyData(withSiblings);
    const legacyRoot = raw.mainId && members[raw.mainId] ? raw.mainId : null;
    return {
      data: { ...final.data, rootId: legacyRoot ? topAncestor(final.data, legacyRoot) : null },
      dropped: legacyRels.length - final.data.relationships.length,
      migrated: true,
    };
  }

  const parsed = familyDataSchema.safeParse(raw);
  if (!parsed.success)
    throw new ImportError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  const { data, dropped } = sanitizeFamilyData(parsed.data);
  return { data, dropped, migrated: false };
};

/** Walk up (father first) to the top-most ancestor. */
const topAncestor = (data: FamilyData, id: string) => {
  let current = id;
  const seen = new Set<string>();
  for (;;) {
    seen.add(current);
    const parents = data.relationships
      .filter((r) => r.type === "parent" && r.toId === current)
      .map((r) => r.fromId)
      .sort(
        (a, b) =>
          (data.members[a].gender === "male" ? -1 : 1) -
          (data.members[b].gender === "male" ? -1 : 1),
      );
    const next = parents.find((p) => !seen.has(p));
    if (!next) return current;
    current = next;
  }
};
