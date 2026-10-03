import {
  getChildIds,
  getConnectedIds,
  getGenerations,
  getParentIds,
  getSpouseIds,
  resolveRootId,
} from "./graph";
import { normalizeText } from "./search";
import type { FamilyData } from "./types";
import { MIN_PARENT_AGE } from "./validation";

export type HealthFixKind = "linkSpouseAsParent";

export interface HealthIssue {
  id: string;
  level: "error" | "warning" | "info";
  /** i18n key under `health.*` */
  code: string;
  memberIds: string[];
  params?: Record<string, string | number>;
  fix?: { kind: HealthFixKind; parentId: string; childId: string };
}

/**
 * Data-quality report for editors: inconsistencies, likely duplicates and
 * suggestions that complete family units.
 */
export const analyzeHealth = (data: FamilyData): HealthIssue[] => {
  const issues: HealthIssue[] = [];
  const rootId = resolveRootId(data);
  const connected = getConnectedIds(data, rootId);
  const generations = getGenerations(data, rootId);

  for (const member of Object.values(data.members)) {
    const id = member.id;
    const parents = getParentIds(data, id);

    if (!connected.has(id))
      issues.push({
        id: `disconnected:${id}`,
        level: "warning",
        code: "disconnected",
        memberIds: [id],
      });

    if (parents.length > 2)
      issues.push({
        id: `tooManyParents:${id}`,
        level: "error",
        code: "tooManyParents",
        memberIds: [id, ...parents],
      });

    const fathers = parents.filter((p) => data.members[p]?.gender === "male");
    const mothers = parents.filter((p) => data.members[p]?.gender === "female");
    if (fathers.length > 1 || mothers.length > 1)
      issues.push({
        id: `sameGenderParents:${id}`,
        level: "error",
        code: "sameGenderParents",
        memberIds: [id, ...parents],
      });

    for (const parentId of parents) {
      const parent = data.members[parentId];
      if (!parent?.birthYear || !member.birthYear) continue;
      const gap = member.birthYear - parent.birthYear;
      if (gap < MIN_PARENT_AGE)
        issues.push({
          id: `age:${parentId}:${id}`,
          level: gap <= 0 ? "error" : "warning",
          code: "parentAgeGap",
          memberIds: [parentId, id],
          params: { years: gap },
        });
    }

    if (member.birthYear && member.deathYear && member.deathYear < member.birthYear)
      issues.push({
        id: `deathBeforeBirth:${id}`,
        level: "error",
        code: "deathBeforeBirth",
        memberIds: [id],
      });

    // A child with only one recorded parent whose parent has exactly one spouse.
    if (parents.length === 1) {
      const spouses = getSpouseIds(data, parents[0]);
      if (spouses.length === 1 && !getParentIds(data, id).includes(spouses[0]))
        issues.push({
          id: `missingParent:${id}`,
          level: "info",
          code: "spouseNotParent",
          memberIds: [id, parents[0], spouses[0]],
          fix: { kind: "linkSpouseAsParent", parentId: spouses[0], childId: id },
        });
    }

    if (generations.has(id) && id !== rootId && parents.length === 0)
      issues.push({ id: `noParents:${id}`, level: "info", code: "noParents", memberIds: [id] });
  }

  // Likely duplicates: same normalised name, gender and parents (or birth year).
  const buckets = new Map<string, string[]>();
  for (const m of Object.values(data.members)) {
    const parentsKey = [...getParentIds(data, m.id)].sort().join(",");
    const key = `${normalizeText(m.name)}|${m.gender}|${parentsKey || m.birthYear || "?"}`;
    if (!parentsKey && !m.birthYear) continue;
    buckets.set(key, [...(buckets.get(key) ?? []), m.id]);
  }
  for (const ids of buckets.values()) {
    if (ids.length > 1)
      issues.push({
        id: `duplicate:${ids.join(":")}`,
        level: "warning",
        code: "possibleDuplicate",
        memberIds: ids,
      });
  }

  // Parents with many children but no recorded spouse.
  for (const m of Object.values(data.members)) {
    if (getChildIds(data, m.id).length > 0 && getSpouseIds(data, m.id).length === 0)
      issues.push({
        id: `noSpouse:${m.id}`,
        level: "info",
        code: "parentWithoutSpouse",
        memberIds: [m.id],
      });
  }

  const order = { error: 0, warning: 1, info: 2 } as const;
  return issues.sort((a, b) => order[a.level] - order[b.level]);
};
