import { FamilyTree } from "../types";

interface ToggleRelsParams {
  tree: FamilyTree;
  nodeId: string;
  relType: "parents" | "spouses" | "children";
}

export function toggleRels({
  tree,
  nodeId,
  relType,
}: ToggleRelsParams): FamilyTree {
  const updatedMembers = { ...tree.members };
  const node = updatedMembers[nodeId];

  if (!node) return tree;

  // Toggle the specified relationship type
  switch (relType) {
    case "parents":
      if (node.parents && node.parents.length > 0) {
        // Remove parent relationships
        node.parents.forEach((parentId) => {
          const parent = updatedMembers[parentId];
          if (parent && parent.children) {
            parent.children = parent.children.filter((id) => id !== nodeId);
          }
        });
        node.parents = [];
      } else {
        // Add placeholder parent
        node.parents = [`${nodeId}-parent-placeholder`];
      }
      break;

    case "spouses":
      if (node.spouses && node.spouses.length > 0) {
        // Remove spouse relationships
        node.spouses.forEach((spouseId) => {
          const spouse = updatedMembers[spouseId];
          if (spouse && spouse.spouses) {
            spouse.spouses = spouse.spouses.filter((id) => id !== nodeId);
          }
        });
        node.spouses = [];
      } else {
        // Add placeholder spouse
        node.spouses = [`${nodeId}-spouse-placeholder`];
      }
      break;

    case "children":
      if (node.children && node.children.length > 0) {
        // Remove child relationships
        node.children.forEach((childId) => {
          const child = updatedMembers[childId];
          if (child && child.parents) {
            child.parents = child.parents.filter((id) => id !== nodeId);
          }
        });
        node.children = [];
      } else {
        // Add placeholder child
        node.children = [`${nodeId}-child-placeholder`];
      }
      break;
  }

  return {
    ...tree,
    members: updatedMembers,
  };
}
