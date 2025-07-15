/**
 * @file Enhanced tree calculation logic for the family tree editor.
 * Handles complex family structures with proper positioning and collision detection.
 */
import * as d3 from "d3";
import { FamilyMember, TreeNodeData, RelationshipConnection } from "../types";
import {
  getParentIds,
  getChildIds,
  getSpouseIds,
  getSiblingIds,
} from "./relationshipHelpers";

/**
 * @interface CalculateTreeParams
 * @description Parameters for the calculateTree function (RelationshipConnection model).
 */
interface CalculateTreeParams {
  members: { [id: string]: FamilyMember };
  relationships: RelationshipConnection[];
  mainId: string;
  nodeSeparation: number;
  levelSeparation: number;
  showSpouses: boolean;
  viewMode?: "full" | "focus";
  focusPersonId?: string | null;
}

interface TreeLevel {
  y: number;
  nodes: TreeNodeData[];
}

interface FamilyGroup {
  parents: string[];
  children: string[];
  spouses: string[];
  midX: number;
}

/**
 * Enhanced tree calculation that handles complex family structures
 */
export function calculateTree({
  members,
  relationships,
  mainId,
  nodeSeparation = 200,
  levelSeparation = 150,
  showSpouses = true,
  viewMode = "full",
  focusPersonId = null,
}: CalculateTreeParams): TreeNodeData[] {
  if (!members || !members[mainId]) {
    console.log(
      "[CalculateTree] No members or invalid mainId, returning empty array"
    );
    return [];
  }

  const dataSize = Object.keys(members).length;
  console.log(
    `[CalculateTree] Starting calculation for ${mainId} with ${dataSize} people, viewMode: ${viewMode}`
  );

  // Handle focus view mode (3-level view)
  let filteredData = members;
  let focusId = mainId;

  if (viewMode === "focus" && focusPersonId && members[focusPersonId]) {
    console.log(
      `[CalculateTree] Using focus mode for person: ${focusPersonId}`
    );
    filteredData = getThreeLevelFamilyData(
      members,
      relationships,
      focusPersonId
    );
    focusId = focusPersonId; // Use the focused person as the root
  }

  const filteredDataSize = Object.keys(filteredData).length;
  console.log(
    `[CalculateTree] Filtered to ${filteredDataSize} people for ${viewMode} view`
  );

  // Safety check for extremely large datasets that could cause performance issues
  if (filteredDataSize > 1000) {
    console.warn(
      `[CalculateTree] Large dataset detected (${filteredDataSize} people), using fallback positioning`
    );
    return fallbackSimplePositioning();
  }

  // Simple fallback positioning function
  function fallbackSimplePositioning(): TreeNodeData[] {
    console.log("[CalculateTree] Using fallback positioning");
    const nodes: TreeNodeData[] = [];
    let x = 0;
    const spacing = nodeSeparation;

    // Just arrange all connected nodes in a simple layout
    const visited = new Set<string>();
    const queue = [mainId];

    while (queue.length > 0) {
      const personId = queue.shift()!;
      if (visited.has(personId) || !filteredData[personId]) continue;

      visited.add(personId);
      const person = filteredData[personId];

      nodes.push({
        ...person,
        x: x,
        y: 0,
        children: [],
        parents: [],
        spouses: [],
      });

      x += spacing;

      // Add connected people to queue using helpers
      [
        ...getChildIds(personId, relationships),
        ...getParentIds(personId, relationships),
        ...getSpouseIds(personId, relationships),
      ].forEach((id) => {
        if (!visited.has(id) && filteredData[id]) {
          queue.push(id);
        }
      });
    }

    return nodes;
  }

  try {
    // Step 1: Build multiple family trees to handle disconnected branches
    const familyTrees = buildMultipleFamilyTrees(
      members,
      relationships,
      focusId,
      showSpouses
    );

    if (familyTrees.length === 0) {
      console.warn(
        "[CalculateTree] Could not build any family trees, using fallback"
      );
      return fallbackSimplePositioning();
    }

    // Step 2: Position each family tree separately and combine results
    const result: TreeNodeData[] = [];
    let currentXOffset = 0;
    const treeSpacing = nodeSeparation * 3; // Space between different family trees

    familyTrees.forEach((treeData, treeIndex) => {
      console.log(
        `[CalculateTree] Processing family tree ${treeIndex + 1}/${
          familyTrees.length
        }`
      );

      // Use D3 tree layout for this specific tree
      const treeWidth = 800; // Smaller width per tree
      const treeHeight = 800;

      const tree = d3
        .tree<any>()
        .size([treeWidth, treeHeight])
        .separation((a, b) => {
          // More space between siblings than between cousins
          return a.parent === b.parent ? 1.2 : 2.0;
        });

      const root = d3.hierarchy(treeData);
      const treeLayout = tree(root);

      // Convert D3 nodes to our format with proper positioning
      const treeNodes: TreeNodeData[] = [];

      treeLayout.each((node: any) => {
        const person = filteredData[node.data.id];
        if (person) {
          // Position within this tree, then offset for multiple trees
          const localX = node.x - treeWidth / 2;
          const globalX = localX + currentXOffset;
          const spacedY = node.y;

          treeNodes.push({
            ...person,
            x: globalX,
            y: spacedY,
            children: [],
            parents: [],
            spouses: [],
            level: node.depth,
          });

          console.log(
            `[CalculateTree] Tree ${treeIndex}: Positioned ${person.name}: (${globalX}, ${spacedY})`
          );
        }
      });

      // Add spouses for this tree
      if (showSpouses) {
        addSpousePositions(
          treeNodes,
          filteredData,
          relationships,
          nodeSeparation
        );
      }

      // Calculate the width of this tree for next offset
      if (treeNodes.length > 0) {
        const minX = Math.min(...treeNodes.map((n) => n.x));
        const maxX = Math.max(...treeNodes.map((n) => n.x));
        const treeActualWidth = maxX - minX;
        currentXOffset += treeActualWidth + treeSpacing;
      }

      result.push(...treeNodes);
    });

    // Step 3: Fine-tune positions to avoid overlaps across all trees
    resolveCollisions(result, nodeSeparation);

    console.log(
      `[CalculateTree] Completed: ${result.length} nodes positioned across ${familyTrees.length} family trees`
    );
    return result;
  } catch (error) {
    console.error("[CalculateTree] Error during calculation:", error);
    return fallbackSimplePositioning();
  }
}

/**
 * Extract 3-level family data centered around a focus person
 * Includes: grandparents, parents, focus person, spouse(s), children, and grandchildren
 */
function getThreeLevelFamilyData(
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[],
  focusPersonId: string
): { [id: string]: FamilyMember } {
  // Always include the focus person
  const ids = new Set<string>([focusPersonId]);

  // Add parents
  getParentIds(focusPersonId, relationships).forEach((id) => ids.add(id));
  // Add siblings (share at least one parent)
  getParentIds(focusPersonId, relationships).forEach((parentId) => {
    getChildIds(parentId, relationships).forEach((sibId) => ids.add(sibId));
  });
  // Add children
  getChildIds(focusPersonId, relationships).forEach((id) => ids.add(id));
  // Add spouses
  getSpouseIds(focusPersonId, relationships).forEach((id) => ids.add(id));

  // Add parents of spouses
  getSpouseIds(focusPersonId, relationships).forEach((spouseId) => {
    getParentIds(spouseId, relationships).forEach((id) => ids.add(id));
    getChildIds(spouseId, relationships).forEach((id) => ids.add(id));
  });

  // Build filtered data
  const filtered: { [id: string]: FamilyMember } = {};
  ids.forEach((id) => {
    if (members[id]) filtered[id] = members[id];
  });
  return filtered;
}

/**
 * Build multiple family trees to handle disconnected family branches
 * This allows for both maternal and paternal family trees to be displayed
 */
function buildMultipleFamilyTrees(
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[],
  mainId: string,
  showSpouses: boolean
): any[] {
  const allPersonIds = Object.keys(members);
  const processedIds = new Set<string>();
  const familyTrees: any[] = [];

  // Helper function to find all connected people from a starting point
  const findConnectedFamily = (startId: string): Set<string> => {
    const connected = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (connected.has(currentId) || !members[currentId]) continue;

      connected.add(currentId);
      // Add all connected relatives to queue using helpers
      [
        ...getChildIds(currentId, relationships),
        ...getParentIds(currentId, relationships),
        ...getSpouseIds(currentId, relationships),
      ].forEach((relativeId) => {
        if (!connected.has(relativeId) && members[relativeId]) {
          queue.push(relativeId);
        }
      });
    }

    return connected;
  };

  // Start with the main person and build their connected family tree
  if (members[mainId]) {
    const mainFamilyIds = findConnectedFamily(mainId);
    const mainFamilyTree = buildSingleFamilyTree(
      members,
      relationships,
      mainId,
      Array.from(mainFamilyIds)
    );
    if (mainFamilyTree) {
      familyTrees.push(mainFamilyTree);
      mainFamilyIds.forEach((id) => processedIds.add(id));
    }
  }

  // Find any remaining disconnected families
  allPersonIds.forEach((personId) => {
    if (!processedIds.has(personId)) {
      const familyIds = findConnectedFamily(personId);
      const familyTree = buildSingleFamilyTree(
        members,
        relationships,
        personId,
        Array.from(familyIds)
      );
      if (familyTree) {
        familyTrees.push(familyTree);
        familyIds.forEach((id) => processedIds.add(id));
      }
    }
  });

  console.log(
    `[buildMultipleFamilyTrees] Built ${familyTrees.length} family trees`
  );
  return familyTrees;
}

/**
 * Build a single family tree from a connected group of people
 */
function buildSingleFamilyTree(
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[],
  rootId: string,
  familyMemberIds: string[]
): any | null {
  // Find the actual root (person with no parents in this family group)
  const findRoot = (startId: string): string => {
    let current = startId;
    const visited = new Set<string>();

    while (
      current &&
      !visited.has(current) &&
      familyMemberIds.includes(current)
    ) {
      visited.add(current);
      const parentIds = getParentIds(current, relationships);
      if (!parentIds || parentIds.length === 0) {
        break;
      }
      // Find a parent that's in our family group
      const parentInGroup = parentIds.find((parentId) =>
        familyMemberIds.includes(parentId)
      );
      if (parentInGroup) {
        current = parentInGroup;
      } else {
        break;
      }
    }

    return current;
  };

  const actualRoot = findRoot(rootId);
  if (!actualRoot || !members[actualRoot]) {
    console.warn(
      `[buildSingleFamilyTree] Could not find root for family containing ${rootId}`
    );
    return null;
  }

  console.log(
    `[buildSingleFamilyTree] Building tree from root: ${actualRoot} for family group of ${familyMemberIds.length} people`
  );

  function buildNode(personId: string, level: number = 0): any {
    const person = members[personId];
    if (!person || !familyMemberIds.includes(personId)) return null;

    const node: any = {
      id: personId,
      name: person.name,
      level: level,
      children: [],
    };

    // Add children to the hierarchy (only those in this family group)
    const childIds = getChildIds(personId, relationships).filter((childId) =>
      familyMemberIds.includes(childId)
    );
    if (childIds.length > 0) {
      childIds.forEach((childId) => {
        if (familyMemberIds.includes(childId) && members[childId]) {
          const childNode = buildNode(childId, level + 1);
          if (childNode) {
            node.children.push(childNode);
          }
        }
      });
    }

    return node;
  }

  const hierarchicalTree = buildNode(actualRoot, 0);

  if (hierarchicalTree) {
    console.log(
      `[buildSingleFamilyTree] Built tree with ${countNodes(
        hierarchicalTree
      )} nodes`
    );
  }

  return hierarchicalTree;
}

/**
 * Count total nodes in hierarchy tree
 */
function countNodes(node: any): number {
  if (!node) return 0;
  let count = 1;
  if (node.children) {
    node.children.forEach((child: any) => {
      count += countNodes(child);
    });
  }
  return count;
}

/**
 * Add spouse positions next to their partners
 */
function addSpousePositions(
  nodes: TreeNodeData[],
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[],
  nodeSeparation: number
) {
  const spouseNodes: TreeNodeData[] = [];

  nodes.forEach((node) => {
    const person = members[node.id];
    getSpouseIds(node.id, relationships).forEach((spouseId, index) => {
      if (members[spouseId] && !nodes.find((n) => n.id === spouseId)) {
        const spouseOffset = (index + 1) * nodeSeparation * 0.8;
        spouseNodes.push({
          ...members[spouseId],
          x: node.x + spouseOffset,
          y: node.y,
          children: [],
          parents: [],
          spouses: [],
          isSpouse: true,
        });
      }
    });
  });

  nodes.push(...spouseNodes);
}

/**
 * Resolve collisions between nodes
 */
function resolveCollisions(nodes: TreeNodeData[], minSeparation: number) {
  // Group nodes by Y level
  const levelGroups = new Map<number, TreeNodeData[]>();

  nodes.forEach((node) => {
    const level = Math.round(node.y / 10) * 10; // Round to nearest 10 for grouping
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // Resolve collisions within each level
  levelGroups.forEach((levelNodes) => {
    levelNodes.sort((a, b) => a.x - b.x);

    for (let i = 1; i < levelNodes.length; i++) {
      const prevNode = levelNodes[i - 1];
      const currentNode = levelNodes[i];
      const distance = currentNode.x - prevNode.x;

      if (distance < minSeparation) {
        const adjustment = minSeparation - distance;
        currentNode.x += adjustment;

        // Propagate adjustment to subsequent nodes
        for (let j = i + 1; j < levelNodes.length; j++) {
          levelNodes[j].x += adjustment;
        }
      }
    }
  });
}

/**
 * Get node dimensions for layout calculations
 */
export function getNodeDimensions() {
  return {
    width: 180,
    height: 120,
    margin: 10,
  };
}

/**
 * Utility functions for family relationships
 */
export const getSiblings = (
  personId: string,
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[]
): FamilyMember[] => {
  const siblingIds = getSiblingIds(personId, relationships);
  return siblingIds.map((id) => members[id]).filter(Boolean);
};

export const getGrandparents = (
  personId: string,
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[]
): FamilyMember[] => {
  const parentIds = getParentIds(personId, relationships);
  const grandparentIds = parentIds.flatMap((parentId) =>
    getParentIds(parentId, relationships)
  );
  return grandparentIds.map((id) => members[id]).filter(Boolean);
};

export const getAuntsUncles = (
  personId: string,
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[]
): FamilyMember[] => {
  const parentIds = getParentIds(personId, relationships);
  return parentIds.flatMap((parentId) =>
    getSiblings(parentId, members, relationships)
  );
};

export const getCousins = (
  personId: string,
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[]
): FamilyMember[] => {
  const auntsUncles = getAuntsUncles(personId, members, relationships);
  return auntsUncles
    .flatMap((auntUncle) =>
      getChildIds(auntUncle.id, relationships).map((id) => members[id])
    )
    .filter(Boolean);
};

// Commented out getNiecesNephews and getInLaws for now to avoid linter errors
// export const getNiecesNephews = () => [];
// export const getInLaws = () => [];

export const getExtendedFamily = (
  personId: string,
  members: { [id: string]: FamilyMember },
  relationships: RelationshipConnection[]
): {
  siblings: FamilyMember[];
  grandparents: FamilyMember[];
  auntsUncles: FamilyMember[];
  cousins: FamilyMember[];
  niecesNephews: FamilyMember[];
  inLaws: FamilyMember[];
  stepSiblings: FamilyMember[];
} => {
  return {
    siblings: getSiblings(personId, members, relationships),
    grandparents: getGrandparents(personId, members, relationships),
    auntsUncles: getAuntsUncles(personId, members, relationships),
    cousins: getCousins(personId, members, relationships),
    niecesNephews: [],
    inLaws: [],
    stepSiblings: [],
  };
};

/**
 * Validation functions
 */
export const validateRelationship = (
  person1: FamilyMember,
  person2: FamilyMember,
  relationshipType: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (relationshipType === "parent") {
    if (person1.birth_year >= person2.birth_year) {
      errors.push("Parent cannot be born in the same year or after child");
    }
  }

  if (relationshipType === "child") {
    if (person1.birth_year <= person2.birth_year) {
      errors.push("Child cannot be born in the same year or before parent");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const detectDuplicates = (
  newPerson: Partial<FamilyMember>,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const potentialDuplicates: FamilyMember[] = [];

  Object.values(data).forEach((existingPerson) => {
    if (newPerson.name && existingPerson.name === newPerson.name) {
      potentialDuplicates.push(existingPerson);
    }

    if (
      newPerson.name &&
      newPerson.birth_year &&
      existingPerson.birth_year &&
      Math.abs(newPerson.birth_year - existingPerson.birth_year) <= 2 &&
      existingPerson.name.includes(newPerson.name.split(" ")[0])
    ) {
      potentialDuplicates.push(existingPerson);
    }
  });

  return potentialDuplicates;
};

/**
 * Legacy function - kept for compatibility
 */
export function calculateAddRelativeTree(
  baseTree: TreeNodeData[],
  targetId: string,
  relationType: "parent" | "spouse" | "child"
): TreeNodeData[] {
  return baseTree;
}
