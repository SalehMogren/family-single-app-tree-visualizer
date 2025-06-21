/**
 * @file Contains tree calculation logic for the family tree editor.
 */
import * as d3 from "d3";
import { FamilyMember, TreeNodeData } from "../types";

/**
 * @interface CalculateTreeParams
 * @description Parameters for the calculateTree function.
 */
interface CalculateTreeParams {
  data: { [id: string]: FamilyMember };
  mainId: string;
  nodeSeparation: number;
  levelSeparation: number;
  showSpouses: boolean;
}

/**
 * Creates a hierarchical structure for a given person's ancestors.
 * @param personId - The ID of the person to start from.
 * @param data - The flat dictionary of all family members.
 * @param visited - A set to track visited nodes and prevent cycles.
 * @returns A hierarchical node for the ancestors.
 */
const buildAncestors = (
  personId: string,
  data: { [id: string]: FamilyMember },
  visited: Set<string>
): TreeNodeData | null => {
  if (!personId || visited.has(personId) || !data[personId]) {
    return null;
  }
  visited.add(personId);

  const {
    parents: parentIds,
    children: _c,
    spouses: _s,
    ...personData
  } = data[personId];

  const node: TreeNodeData = {
    ...personData,
    x: 0,
    y: 0,
    isAncestry: true,
    children: parentIds
      ?.map((pId) => buildAncestors(pId, data, visited))
      .filter(Boolean) as TreeNodeData[],
  };
  return node;
};

/**
 * Creates a hierarchical structure for a given person's descendants.
 * @param personId - The ID of the person to start from.
 * @param data - The flat dictionary of all family members.
 * @param visited - A set to track visited nodes and prevent cycles.
 * @returns A hierarchical node for the descendants.
 */
const buildDescendants = (
  personId: string,
  data: { [id: string]: FamilyMember },
  visited: Set<string>
): TreeNodeData | null => {
  if (!personId || visited.has(personId) || !data[personId]) {
    return null;
  }
  visited.add(personId);

  const {
    children: childIds,
    parents: _p,
    spouses: _s,
    ...personData
  } = data[personId];

  const node: TreeNodeData = {
    ...personData,
    x: 0,
    y: 0,
    children: childIds
      ?.map((cId) => buildDescendants(cId, data, visited))
      .filter(Boolean) as TreeNodeData[],
  };
  return node;
};

/**
 * Calculates the tree layout from the flat data structure,
 * including ancestors, descendants, and spouses.
 * @returns A flat array of all nodes with their calculated positions.
 */
export function calculateTree({
  data,
  mainId,
  nodeSeparation = 200,
  levelSeparation = 150,
  showSpouses = true,
}: CalculateTreeParams): TreeNodeData[] {
  if (!data || !data[mainId]) return [];

  // 1. Traverse the tree to build a clean hierarchy for d3
  const buildHierarchy = (
    personId: string,
    visited: Set<string>
  ): TreeNodeData | null => {
    if (!personId || visited.has(personId) || !data[personId]) {
      return null;
    }
    visited.add(personId);
    const person = data[personId];
    const children = (person.children || [])
      .map((childId) => buildHierarchy(childId, visited))
      .filter((c): c is TreeNodeData => !!c);

    // Explicitly cast to TreeNodeData, ensuring properties match
    return {
      ...(person as Omit<FamilyMember, "children" | "parents" | "spouses">),
      x: 0,
      y: 0,
      children: children,
      id: person.id,
      name: person.name,
      gender: person.gender,
      birth_year: person.birth_year,
    };
  };

  const root = buildHierarchy(mainId, new Set());
  if (!root) return [];

  // 2. Use d3 to calculate initial layout
  const hierarchy = d3.hierarchy(root);
  d3.tree<TreeNodeData>().nodeSize([nodeSeparation, levelSeparation])(
    hierarchy
  );

  const allNodes = new Map<string, TreeNodeData>();
  hierarchy.descendants().forEach((d3Node) => {
    const node = d3Node.data;
    node.x = d3Node.x!;
    node.y = d3Node.y!;
    allNodes.set(node.id, node);
  });

  // 3. Add spouses and adjust for multiple spouses
  if (showSpouses) {
    const positionedSpouses = new Set<string>();
    hierarchy.descendants().forEach((d3Node) => {
      const node = d3Node.data;
      const person = data[node.id];
      if (person?.spouses) {
        let spouseOffset = 1;
        person.spouses.forEach((spouseId) => {
          if (allNodes.has(spouseId)) {
            // This spouse is already in the main tree, link them
            const spouseNode = allNodes.get(spouseId)!;
            if (Math.abs(spouseNode.y - node.y) < levelSeparation / 2) {
              // They are on the same level, adjust x to be closer
              spouseNode.x =
                node.x + (nodeSeparation / 2.5) * (node.id > spouseId ? -1 : 1);
            }
            return;
          }

          if (positionedSpouses.has(spouseId)) return;

          const spouseData = data[spouseId];
          if (spouseData) {
            const spouseNode: TreeNodeData = {
              ...(spouseData as Omit<
                FamilyMember,
                "children" | "parents" | "spouses"
              >),
              id: spouseData.id,
              name: spouseData.name,
              gender: spouseData.gender,
              birth_year: spouseData.birth_year,
              x: node.x + (nodeSeparation / 2) * spouseOffset,
              y: node.y,
              isSpouse: true,
            };
            allNodes.set(spouseId, spouseNode);
            positionedSpouses.add(spouseId);
            spouseOffset *= -1; // Alternate sides for multiple spouses
          }
        });
      }
    });
  }
  return Array.from(allNodes.values());
}

/**
 * This function is no longer needed as placeholders are added directly in the BaseTree component.
 * It is kept for reference but should be considered deprecated.
 * @deprecated
 */
export function calculateAddRelativeTree(
  baseTree: TreeNodeData[],
  targetId: string,
  relationType: "parent" | "spouse" | "child"
): TreeNodeData[] {
  // ... (implementation remains for reference)
  return baseTree;
}

export function getNodeDimensions() {
  return {
    width: 140,
    height: 80,
    margin: 10,
  };
}
