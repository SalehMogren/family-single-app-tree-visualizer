import { FamilyMember, RelationshipConnection } from "../types";

/**
 * Get all parent IDs for a person.
 */
export function getParentIds(
  personId: string,
  relationships: RelationshipConnection[]
): string[] {
  return relationships
    .filter((rel) => rel.type === "parent" && rel.toId === personId)
    .map((rel) => rel.fromId);
}

/**
 * Get all child IDs for a person.
 */
export function getChildIds(
  personId: string,
  relationships: RelationshipConnection[]
): string[] {
  return relationships
    .filter((rel) => rel.type === "parent" && rel.fromId === personId)
    .map((rel) => rel.toId);
}

/**
 * Get all spouse IDs for a person.
 */
export function getSpouseIds(
  personId: string,
  relationships: RelationshipConnection[]
): string[] {
  return relationships
    .filter(
      (rel) =>
        rel.type === "spouse" &&
        (rel.fromId === personId || rel.toId === personId)
    )
    .map((rel) => (rel.fromId === personId ? rel.toId : rel.fromId));
}

/**
 * Get all sibling IDs for a person.
 */
export function getSiblingIds(
  personId: string,
  relationships: RelationshipConnection[]
): string[] {
  return relationships
    .filter(
      (rel) =>
        rel.type === "sibling" &&
        (rel.fromId === personId || rel.toId === personId)
    )
    .map((rel) => (rel.fromId === personId ? rel.toId : rel.fromId));
}
