import {
  getChildIds,
  getDescendantIds,
  getParentIds,
  getSiblingIds,
  getSpouseIds,
  isAncestor,
} from "./graph";
import type { FamilyData, Issue, Member, ValidationResult } from "./types";

/** Minimum plausible age gap between a parent and a child. */
export const MIN_PARENT_AGE = 13;
export const MAX_PARENTS = 2;

const result = (issues: Issue[]): ValidationResult => ({
  ok: !issues.some((i) => i.level === "error"),
  issues,
});

const lifespansOverlap = (a: Member, b: Member) => {
  const aStart = a.birthYear ?? Number.NEGATIVE_INFINITY;
  const bStart = b.birthYear ?? Number.NEGATIVE_INFINITY;
  const aEnd = a.deathYear ?? Number.POSITIVE_INFINITY;
  const bEnd = b.deathYear ?? Number.POSITIVE_INFINITY;
  return aStart <= bEnd && bStart <= aEnd;
};

const ageIssues = (parent: Member, child: Member): Issue[] => {
  if (!parent.birthYear || !child.birthYear) return [];
  const gap = child.birthYear - parent.birthYear;
  if (gap <= 0) return [{ level: "error", code: "parentYoungerThanChild" }];
  if (gap < MIN_PARENT_AGE)
    return [{ level: "warning", code: "parentTooYoung", params: { years: gap } }];
  if (parent.deathYear && child.birthYear > parent.deathYear + 1)
    return [{ level: "warning", code: "childBornAfterParentDeath" }];
  return [];
};

/** Can `parentId` become a parent of `childId`? */
export const validateParentLink = (
  data: FamilyData,
  parentId: string,
  childId: string,
): ValidationResult => {
  const parent = data.members[parentId];
  const child = data.members[childId];
  if (!parent || !child) return result([{ level: "error", code: "memberNotFound" }]);
  if (parentId === childId) return result([{ level: "error", code: "selfRelation" }]);

  const issues: Issue[] = [];
  const parents = getParentIds(data, childId);
  if (parents.includes(parentId)) issues.push({ level: "error", code: "alreadyParent" });
  if (parents.length >= MAX_PARENTS) issues.push({ level: "error", code: "maxParents" });
  if (parents.some((p) => data.members[p]?.gender === parent.gender))
    issues.push({
      level: "error",
      code: parent.gender === "male" ? "alreadyHasFather" : "alreadyHasMother",
    });
  if (isAncestor(data, childId, parentId)) issues.push({ level: "error", code: "circular" });
  if (getSpouseIds(data, childId).includes(parentId))
    issues.push({ level: "error", code: "spouseCannotBeParent" });
  issues.push(...ageIssues(parent, child));
  return result(issues);
};

export const validateSpouseLink = (
  data: FamilyData,
  aId: string,
  bId: string,
): ValidationResult => {
  const a = data.members[aId];
  const b = data.members[bId];
  if (!a || !b) return result([{ level: "error", code: "memberNotFound" }]);
  if (aId === bId) return result([{ level: "error", code: "selfRelation" }]);

  const issues: Issue[] = [];
  if (getSpouseIds(data, aId).includes(bId))
    issues.push({ level: "error", code: "alreadySpouses" });
  if (isAncestor(data, aId, bId) || isAncestor(data, bId, aId))
    issues.push({ level: "error", code: "spouseIsLineal" });
  if (getSiblingIds(data, aId).includes(bId))
    issues.push({ level: "error", code: "spouseIsSibling" });
  if (a.gender === b.gender) issues.push({ level: "warning", code: "sameGenderSpouses" });
  if (!lifespansOverlap(a, b)) issues.push({ level: "warning", code: "lifespansDontOverlap" });
  return result(issues);
};

/** Validates a *new* person (not yet in the dataset) being attached to `targetId`. */
export const validateNewRelative = (
  data: FamilyData,
  targetId: string,
  relation: "parent" | "child" | "spouse" | "sibling",
  draft: Pick<Member, "gender" | "birthYear" | "deathYear" | "name">,
): ValidationResult => {
  const target = data.members[targetId];
  if (!target) return result([{ level: "error", code: "memberNotFound" }]);
  const issues: Issue[] = [];
  const candidate = { ...draft, id: "__draft__" } as Member;

  if (relation === "parent") {
    const parents = getParentIds(data, targetId);
    if (parents.length >= MAX_PARENTS) issues.push({ level: "error", code: "maxParents" });
    if (parents.some((p) => data.members[p]?.gender === draft.gender))
      issues.push({
        level: "error",
        code: draft.gender === "male" ? "alreadyHasFather" : "alreadyHasMother",
      });
    issues.push(...ageIssues(candidate, target));
  }
  if (relation === "child") issues.push(...ageIssues(target, candidate));
  if (relation === "spouse") {
    if (target.gender === draft.gender)
      issues.push({ level: "warning", code: "sameGenderSpouses" });
    if (!lifespansOverlap(target, candidate))
      issues.push({ level: "warning", code: "lifespansDontOverlap" });
  }
  if (relation === "sibling" && getParentIds(data, targetId).length === 0)
    issues.push({ level: "error", code: "siblingNeedsParent" });

  const normalized = draft.name.trim();
  const duplicate = Object.values(data.members).find(
    (m) =>
      m.name.trim() === normalized &&
      m.gender === draft.gender &&
      (m.birthYear ?? null) === (draft.birthYear ?? null),
  );
  if (duplicate)
    issues.push({ level: "warning", code: "possibleDuplicate", params: { name: duplicate.name } });
  return result(issues);
};

export interface DeletionImpact {
  relationships: number;
  /** Children who would be left with no recorded parent. */
  orphanedChildIds: string[];
  /** All blood descendants (removed when cascading). */
  descendantIds: string[];
  isRoot: boolean;
}

export const getDeletionImpact = (data: FamilyData, id: string): DeletionImpact => ({
  relationships: data.relationships.filter((r) => r.fromId === id || r.toId === id).length,
  orphanedChildIds: getChildIds(data, id).filter((c) => getParentIds(data, c).length === 1),
  descendantIds: [...getDescendantIds(data, id)],
  isRoot: data.rootId === id,
});
