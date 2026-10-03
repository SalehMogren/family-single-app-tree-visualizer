import { getChildIds, getDescendantIds, getParentIds, getSpouseIds } from "./graph";
import type { FamilyData, Member, MemberInput, Relationship } from "./types";
import { validateNewRelative, validateParentLink, validateSpouseLink } from "./validation";

export class FamilyMutationError extends Error {
  constructor(
    public code: string,
    public params?: Record<string, string | number>,
  ) {
    super(code);
    this.name = "FamilyMutationError";
  }
}

export const createId = (prefix = "m") => {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
};

const now = () => new Date().toISOString();

const touch = (data: FamilyData, patch: Partial<FamilyData>): FamilyData => ({
  ...data,
  ...patch,
  updatedAt: now(),
});

const clean = (input: MemberInput): MemberInput => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === "" || value === undefined || value === null) continue;
    out[key] = typeof value === "string" ? value.trim() : value;
  }
  return out as MemberInput;
};

const relationshipId = (type: Relationship["type"], fromId: string, toId: string) =>
  type === "spouse" ? `spouse:${[fromId, toId].sort().join(":")}` : `parent:${fromId}:${toId}`;

const makeRelationship = (
  type: Relationship["type"],
  fromId: string,
  toId: string,
  metadata?: Relationship["metadata"],
): Relationship => ({
  id: relationshipId(type, fromId, toId),
  type,
  fromId,
  toId,
  ...(metadata ? { metadata } : {}),
});

export const addMember = (data: FamilyData, input: MemberInput, id = createId()) => {
  const timestamp = now();
  const member: Member = { ...clean(input), id, createdAt: timestamp, updatedAt: timestamp };
  const next = touch(data, { members: { ...data.members, [id]: member } });
  if (!next.rootId) next.rootId = id;
  return { data: next, member };
};

export const updateMember = (data: FamilyData, id: string, input: MemberInput): FamilyData => {
  const existing = data.members[id];
  if (!existing) throw new FamilyMutationError("memberNotFound");
  const member: Member = {
    ...clean(input),
    id,
    createdAt: existing.createdAt,
    updatedAt: now(),
  };
  return touch(data, { members: { ...data.members, [id]: member } });
};

/** Remove a member and every relationship touching them. Optionally remove all descendants too. */
export const removeMember = (
  data: FamilyData,
  id: string,
  { cascade = false }: { cascade?: boolean } = {},
): FamilyData => {
  if (!data.members[id]) throw new FamilyMutationError("memberNotFound");
  const doomed = new Set([id, ...(cascade ? getDescendantIds(data, id) : [])]);
  const members = Object.fromEntries(Object.entries(data.members).filter(([k]) => !doomed.has(k)));
  const relationships = data.relationships.filter(
    (r) => !doomed.has(r.fromId) && !doomed.has(r.toId),
  );
  let rootId = data.rootId;
  if (rootId && doomed.has(rootId)) {
    const children = getChildIds(data, rootId).filter((c) => !doomed.has(c));
    rootId = children[0] ?? Object.keys(members)[0] ?? null;
  }
  return touch(data, { members, relationships, rootId });
};

export const linkParent = (
  data: FamilyData,
  parentId: string,
  childId: string,
  metadata?: Relationship["metadata"],
): FamilyData => {
  const check = validateParentLink(data, parentId, childId);
  const error = check.issues.find((i) => i.level === "error");
  if (error) throw new FamilyMutationError(error.code, error.params);
  return touch(data, {
    relationships: [...data.relationships, makeRelationship("parent", parentId, childId, metadata)],
  });
};

export const linkSpouses = (
  data: FamilyData,
  aId: string,
  bId: string,
  metadata?: Relationship["metadata"],
): FamilyData => {
  const check = validateSpouseLink(data, aId, bId);
  const error = check.issues.find((i) => i.level === "error");
  if (error) throw new FamilyMutationError(error.code, error.params);
  return touch(data, {
    relationships: [...data.relationships, makeRelationship("spouse", aId, bId, metadata)],
  });
};

export const unlink = (data: FamilyData, relationshipId: string): FamilyData =>
  touch(data, { relationships: data.relationships.filter((r) => r.id !== relationshipId) });

export const updateRelationshipMetadata = (
  data: FamilyData,
  relationshipId: string,
  metadata: Relationship["metadata"],
): FamilyData =>
  touch(data, {
    relationships: data.relationships.map((r) =>
      r.id === relationshipId ? { ...r, metadata } : r,
    ),
  });

export const findRelationship = (
  data: FamilyData,
  type: Relationship["type"],
  aId: string,
  bId: string,
) =>
  data.relationships.find(
    (r) =>
      r.type === type &&
      ((r.fromId === aId && r.toId === bId) ||
        (type === "spouse" && r.fromId === bId && r.toId === aId)),
  );

export interface AddRelativeOptions {
  /** For "child": the other parent. Defaults to the target's only spouse when there is exactly one. */
  otherParentId?: string | null;
  /** For "parent": also link the new parent as spouse of the existing parent. Default true. */
  linkExistingParent?: boolean;
  /** For "spouse": also make the new spouse a parent of these existing children. */
  adoptChildIds?: string[];
}

/**
 * Create a new member and attach them to `targetId` in one step.
 * Returns the new dataset and the created member.
 */
export const addRelative = (
  data: FamilyData,
  targetId: string,
  relation: "parent" | "child" | "spouse" | "sibling",
  input: MemberInput,
  options: AddRelativeOptions = {},
) => {
  const check = validateNewRelative(data, targetId, relation, input);
  const error = check.issues.find((i) => i.level === "error");
  if (error) throw new FamilyMutationError(error.code, error.params);

  const { data: withMember, member } = addMember(data, input);
  const rels: Relationship[] = [];

  if (relation === "parent") {
    const existingParents = getParentIds(data, targetId);
    rels.push(makeRelationship("parent", member.id, targetId));
    if (options.linkExistingParent !== false && existingParents.length === 1) {
      const other = existingParents[0];
      if (!getSpouseIds(data, other).includes(member.id))
        rels.push(makeRelationship("spouse", other, member.id));
    }
    // A person who becomes the parent of the root becomes the new root.
    if (data.rootId === targetId) withMember.rootId = member.id;
  }

  if (relation === "child") {
    rels.push(makeRelationship("parent", targetId, member.id));
    const spouses = getSpouseIds(data, targetId);
    const otherParent =
      options.otherParentId === undefined
        ? spouses.length === 1
          ? spouses[0]
          : null
        : options.otherParentId;
    if (otherParent && data.members[otherParent])
      rels.push(makeRelationship("parent", otherParent, member.id));
  }

  if (relation === "spouse") {
    rels.push(makeRelationship("spouse", targetId, member.id));
    for (const childId of options.adoptChildIds ?? []) {
      if (getParentIds(data, childId).length < 2)
        rels.push(makeRelationship("parent", member.id, childId));
    }
  }

  if (relation === "sibling") {
    for (const parentId of getParentIds(data, targetId))
      rels.push(makeRelationship("parent", parentId, member.id));
  }

  return {
    data: { ...withMember, relationships: [...withMember.relationships, ...rels] },
    member,
  };
};

export const setRoot = (data: FamilyData, rootId: string | null): FamilyData => {
  if (rootId && !data.members[rootId]) throw new FamilyMutationError("memberNotFound");
  return touch(data, { rootId });
};

export const emptyFamilyData = (): FamilyData => ({
  schemaVersion: 2,
  revision: 0,
  rootId: null,
  members: {},
  relationships: [],
  updatedAt: now(),
});
