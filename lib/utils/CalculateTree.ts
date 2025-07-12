/**
 * @file Enhanced tree calculation logic for the family tree editor.
 * Handles complex family structures with proper positioning and collision detection.
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
  data,
  mainId,
  nodeSeparation = 200,
  levelSeparation = 150,
  showSpouses = true,
  viewMode = "full",
  focusPersonId = null,
}: CalculateTreeParams): TreeNodeData[] {
  if (!data || !data[mainId]) {
    console.log('[CalculateTree] No data or invalid mainId, returning empty array');
    return [];
  }

  const dataSize = Object.keys(data).length;
  console.log(`[CalculateTree] Starting calculation for ${mainId} with ${dataSize} people, viewMode: ${viewMode}`);
  
  // Handle focus view mode (3-level view)
  let filteredData = data;
  let focusId = mainId;
  
  if (viewMode === "focus" && focusPersonId && data[focusPersonId]) {
    console.log(`[CalculateTree] Using focus mode for person: ${focusPersonId}`);
    filteredData = getThreeLevelFamilyData(data, focusPersonId);
    focusId = focusPersonId;
  }
  
  const filteredDataSize = Object.keys(filteredData).length;
  console.log(`[CalculateTree] Filtered to ${filteredDataSize} people for ${viewMode} view`);
  
  // Safety check for extremely large datasets that could cause performance issues
  if (filteredDataSize > 1000) {
    console.warn(`[CalculateTree] Large dataset detected (${filteredDataSize} people), using fallback positioning`);
    return fallbackSimplePositioning();
  }

  // Simple fallback positioning function
  function fallbackSimplePositioning(): TreeNodeData[] {
    console.log('[CalculateTree] Using fallback positioning');
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

      // Add connected people to queue
      [...(person.children || []), ...(person.parents || []), ...(person.spouses || [])]
        .forEach(id => {
          if (!visited.has(id) && filteredData[id]) {
            queue.push(id);
          }
        });
    }

    return nodes;
  }

  try {
    // Step 1: Build multiple family trees to handle disconnected branches
    const familyTrees = buildMultipleFamilyTrees(filteredData, focusId, showSpouses);
    
    if (familyTrees.length === 0) {
      console.warn('[CalculateTree] Could not build any family trees, using fallback');
      return fallbackSimplePositioning();
    }

    // Step 2: Position each family tree separately and combine results
    const result: TreeNodeData[] = [];
    let currentXOffset = 0;
    const treeSpacing = nodeSeparation * 3; // Space between different family trees
    
    familyTrees.forEach((treeData, treeIndex) => {
      console.log(`[CalculateTree] Processing family tree ${treeIndex + 1}/${familyTrees.length}`);
      
      // Use D3 tree layout for this specific tree
      const treeWidth = 800; // Smaller width per tree
      const treeHeight = 800;
      
      const tree = d3.tree<any>()
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
          const localX = node.x - (treeWidth / 2);
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
          
          console.log(`[CalculateTree] Tree ${treeIndex}: Positioned ${person.name}: (${globalX}, ${spacedY})`);
        }
      });
      
      // Add spouses for this tree
      if (showSpouses) {
        addSpousePositions(treeNodes, filteredData, nodeSeparation);
      }
      
      // Calculate the width of this tree for next offset
      if (treeNodes.length > 0) {
        const minX = Math.min(...treeNodes.map(n => n.x));
        const maxX = Math.max(...treeNodes.map(n => n.x));
        const treeActualWidth = maxX - minX;
        currentXOffset += treeActualWidth + treeSpacing;
      }
      
      result.push(...treeNodes);
    });

    // Step 3: Fine-tune positions to avoid overlaps across all trees
    resolveCollisions(result, nodeSeparation);

    console.log(`[CalculateTree] Completed: ${result.length} nodes positioned across ${familyTrees.length} family trees`);
    return result;

  } catch (error) {
    console.error('[CalculateTree] Error during calculation:', error);
    return fallbackSimplePositioning();
  }
}

/**
 * Extract 3-level family data centered around a focus person
 * Includes: grandparents, parents, focus person, spouse(s), children, and grandchildren
 */
function getThreeLevelFamilyData(data: { [id: string]: FamilyMember }, focusPersonId: string): { [id: string]: FamilyMember } {
  const focusPerson = data[focusPersonId];
  if (!focusPerson) return {};
  
  const threeLevelData: { [id: string]: FamilyMember } = {};
  const includedIds = new Set<string>();
  
  // Helper to add person and mark as included
  const addPerson = (personId: string) => {
    if (data[personId] && !includedIds.has(personId)) {
      threeLevelData[personId] = data[personId];
      includedIds.add(personId);
    }
  };
  
  // Level 0: Focus person
  addPerson(focusPersonId);
  
  // Level -1: Parents and spouses
  focusPerson.parents?.forEach(addPerson);
  focusPerson.spouses?.forEach(addPerson);
  
  // Level -2: Grandparents (parents of parents)
  focusPerson.parents?.forEach(parentId => {
    const parent = data[parentId];
    if (parent) {
      parent.parents?.forEach(addPerson);
    }
  });
  
  // Level +1: Children
  focusPerson.children?.forEach(addPerson);
  
  // Level +2: Grandchildren (children of children)
  focusPerson.children?.forEach(childId => {
    const child = data[childId];
    if (child) {
      child.children?.forEach(addPerson);
    }
  });
  
  // Also include spouses of children for context
  focusPerson.children?.forEach(childId => {
    const child = data[childId];
    if (child) {
      child.spouses?.forEach(addPerson);
    }
  });
  
  console.log(`[getThreeLevelFamilyData] Extracted ${Object.keys(threeLevelData).length} people for 3-level view of ${focusPerson.name}`);
  return threeLevelData;
}

/**
 * Build multiple family trees to handle disconnected family branches
 * This allows for both maternal and paternal family trees to be displayed
 */
function buildMultipleFamilyTrees(data: { [id: string]: FamilyMember }, mainId: string, showSpouses: boolean): any[] {
  const allPersonIds = Object.keys(data);
  const processedIds = new Set<string>();
  const familyTrees: any[] = [];
  
  // Helper function to find all connected people from a starting point
  const findConnectedFamily = (startId: string): Set<string> => {
    const connected = new Set<string>();
    const queue = [startId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (connected.has(currentId) || !data[currentId]) continue;
      
      connected.add(currentId);
      const person = data[currentId];
      
      // Add all connected relatives to queue
      [...(person.parents || []), ...(person.children || []), ...(person.spouses || [])]
        .forEach(relativeId => {
          if (!connected.has(relativeId) && data[relativeId]) {
            queue.push(relativeId);
          }
        });
    }
    
    return connected;
  };
  
  // Start with the main person and build their connected family tree
  if (data[mainId]) {
    const mainFamilyIds = findConnectedFamily(mainId);
    const mainFamilyTree = buildSingleFamilyTree(data, mainId, Array.from(mainFamilyIds));
    if (mainFamilyTree) {
      familyTrees.push(mainFamilyTree);
      mainFamilyIds.forEach(id => processedIds.add(id));
    }
  }
  
  // Find any remaining disconnected families
  allPersonIds.forEach(personId => {
    if (!processedIds.has(personId)) {
      const familyIds = findConnectedFamily(personId);
      const familyTree = buildSingleFamilyTree(data, personId, Array.from(familyIds));
      if (familyTree) {
        familyTrees.push(familyTree);
        familyIds.forEach(id => processedIds.add(id));
      }
    }
  });
  
  console.log(`[buildMultipleFamilyTrees] Built ${familyTrees.length} family trees`);
  return familyTrees;
}

/**
 * Build a single family tree from a connected group of people
 */
function buildSingleFamilyTree(data: { [id: string]: FamilyMember }, rootId: string, familyMemberIds: string[]): any | null {
  // Find the actual root (person with no parents in this family group)
  const findRoot = (startId: string): string => {
    let current = startId;
    const visited = new Set<string>();
    
    while (current && !visited.has(current) && familyMemberIds.includes(current)) {
      visited.add(current);
      const person = data[current];
      if (!person || !person.parents || person.parents.length === 0) {
        break;
      }
      // Find a parent that's in our family group
      const parentInGroup = person.parents.find(parentId => familyMemberIds.includes(parentId));
      if (parentInGroup) {
        current = parentInGroup;
      } else {
        break;
      }
    }
    
    return current;
  };
  
  const actualRoot = findRoot(rootId);
  if (!actualRoot || !data[actualRoot]) {
    console.warn(`[buildSingleFamilyTree] Could not find root for family containing ${rootId}`);
    return null;
  }
  
  console.log(`[buildSingleFamilyTree] Building tree from root: ${actualRoot} for family group of ${familyMemberIds.length} people`);
  
  function buildNode(personId: string, level: number = 0): any {
    const person = data[personId];
    if (!person || !familyMemberIds.includes(personId)) return null;
    
    const node: any = {
      id: personId,
      name: person.name,
      level: level,
      children: []
    };

    // Add children to the hierarchy (only those in this family group)
    if (person.children && person.children.length > 0) {
      person.children.forEach(childId => {
        if (familyMemberIds.includes(childId) && data[childId]) {
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
    console.log(`[buildSingleFamilyTree] Built tree with ${countNodes(hierarchicalTree)} nodes`);
  }
  
  return hierarchicalTree;
}

/**
 * Build a hierarchical data structure suitable for D3 tree layout
 * Starting from the root ancestor and building downward
 * @deprecated Use buildMultipleFamilyTrees instead
 */
function buildHierarchy(data: { [id: string]: FamilyMember }, mainId: string, showSpouses: boolean): any | null {
  // Find the root of the family tree (person with no parents)
  const findRoot = (startId: string): string => {
    let current = startId;
    const visited = new Set<string>();
    
    while (current && !visited.has(current)) {
      visited.add(current);
      const person = data[current];
      if (!person || !person.parents || person.parents.length === 0) {
        break;
      }
      // Go up to the first parent
      current = person.parents[0];
    }
    
    return current;
  };
  
  const rootId = findRoot(mainId);
  if (!rootId || !data[rootId]) {
    console.warn(`[CalculateTree] Could not find root for ${mainId}`);
    return null;
  }
  
  console.log(`[CalculateTree] Building hierarchy from root: ${rootId}`);
  
  function buildNode(personId: string, level: number = 0): any {
    const person = data[personId];
    if (!person) return null;
    
    const node: any = {
      id: personId,
      name: person.name,
      level: level,
      children: []
    };

    // Add children to the hierarchy
    if (person.children && person.children.length > 0) {
      person.children.forEach(childId => {
        if (data[childId]) {
          const childNode = buildNode(childId, level + 1);
          if (childNode) {
            node.children.push(childNode);
          }
        }
      });
    }

    return node;
  }

  const hierarchicalTree = buildNode(rootId, 0);
  
  if (hierarchicalTree) {
    console.log(`[CalculateTree] Built hierarchy with ${countNodes(hierarchicalTree)} nodes`);
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
function addSpousePositions(nodes: TreeNodeData[], data: { [id: string]: FamilyMember }, nodeSeparation: number) {
  const spouseNodes: TreeNodeData[] = [];
  
  nodes.forEach(node => {
    const person = data[node.id];
    if (person.spouses) {
      person.spouses.forEach((spouseId, index) => {
        if (data[spouseId] && !nodes.find(n => n.id === spouseId)) {
          const spouseOffset = (index + 1) * nodeSeparation * 0.8;
          spouseNodes.push({
            ...data[spouseId],
            x: node.x + spouseOffset,
            y: node.y,
            children: [],
            parents: [],
            spouses: [],
            isSpouse: true,
          });
        }
      });
    }
  });
  
  nodes.push(...spouseNodes);
}

/**
 * Resolve collisions between nodes
 */
function resolveCollisions(nodes: TreeNodeData[], minSeparation: number) {
  // Group nodes by Y level
  const levelGroups = new Map<number, TreeNodeData[]>();
  
  nodes.forEach(node => {
    const level = Math.round(node.y / 10) * 10; // Round to nearest 10 for grouping
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // Resolve collisions within each level
  levelGroups.forEach(levelNodes => {
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
    width: 180, // Match TreeSvg default settings
    height: 120, // Match TreeSvg default settings
    margin: 10,
  };
}

/**
 * Utility functions for deriving extended family relationships
 * from the basic parent/child/spouse data model
 */

/**
 * Get all siblings of a person (people with same parents)
 */
export const getSiblings = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const person = data[personId];
  if (!person?.parents?.length) return [];

  return Object.values(data).filter(
    (p) =>
      p.id !== personId &&
      p.parents?.some((parentId) => person.parents!.includes(parentId))
  );
};

/**
 * Get grandparents of a person (parents of parents)
 */
export const getGrandparents = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const person = data[personId];
  if (!person?.parents?.length) return [];

  const grandparentIds = person.parents.flatMap(
    (parentId) => data[parentId]?.parents || []
  );

  return grandparentIds.map((id) => data[id]).filter(Boolean);
};

/**
 * Get great-grandparents of a person
 */
export const getGreatGrandparents = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const grandparents = getGrandparents(personId, data);
  return grandparents
    .flatMap((grandparent) => grandparent.parents?.map((id) => data[id]) || [])
    .filter(Boolean);
};

/**
 * Get aunts and uncles of a person (siblings of parents)
 */
export const getAuntsUncles = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const person = data[personId];
  if (!person?.parents?.length) return [];

  return person.parents.flatMap((parentId) => getSiblings(parentId, data));
};

/**
 * Get cousins of a person (children of aunts/uncles)
 */
export const getCousins = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const auntsUncles = getAuntsUncles(personId, data);
  return auntsUncles.flatMap((auntUncle) =>
    Object.values(data).filter((p) => p.parents?.includes(auntUncle.id))
  );
};

/**
 * Get nieces and nephews of a person (children of siblings)
 */
export const getNiecesNephews = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const siblings = getSiblings(personId, data);
  return siblings.flatMap((sibling) =>
    Object.values(data).filter((p) => p.parents?.includes(sibling.id))
  );
};

/**
 * Get in-laws of a person (parents and siblings of spouses)
 */
export const getInLaws = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const person = data[personId];
  if (!person?.spouses?.length) return [];

  return person.spouses.flatMap((spouseId) => {
    const spouse = data[spouseId];
    return [
      ...(spouse.parents?.map((id) => data[id]) || []),
      ...getSiblings(spouseId, data),
    ];
  });
};

/**
 * Get step-siblings (children of step-parents)
 */
export const getStepSiblings = (
  personId: string,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  const person = data[personId];
  if (!person?.parents?.length) return [];

  // Get all step-parents (spouses of biological parents)
  const stepParentIds = person.parents.flatMap(
    (parentId) =>
      data[parentId]?.spouses?.filter(
        (spouseId) => !person.parents!.includes(spouseId)
      ) || []
  );

  // Get children of step-parents (excluding self and full siblings)
  return stepParentIds.flatMap((stepParentId) =>
    Object.values(data).filter(
      (p) =>
        p.parents?.includes(stepParentId) &&
        p.id !== personId &&
        !getSiblings(personId, data).some((sibling) => sibling.id === p.id)
    )
  );
};

/**
 * Get all extended family members (up to 3 generations)
 */
export const getExtendedFamily = (
  personId: string,
  data: { [id: string]: FamilyMember }
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
    siblings: getSiblings(personId, data),
    grandparents: getGrandparents(personId, data),
    auntsUncles: getAuntsUncles(personId, data),
    cousins: getCousins(personId, data),
    niecesNephews: getNiecesNephews(personId, data),
    inLaws: getInLaws(personId, data),
    stepSiblings: getStepSiblings(personId, data),
  };
};

/**
 * Validate relationship logic (age, duplicates, etc.)
 */
export const validateRelationship = (
  person1: FamilyMember,
  person2: FamilyMember,
  relationshipType: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Age validation
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

  if (relationshipType === "sibling") {
    const ageDiff = Math.abs(person1.birth_year - person2.birth_year);
    if (ageDiff > 50) {
      errors.push("Siblings should have a reasonable age difference");
    }
  }

  // Death year validation
  if (person1.death_year && person2.death_year) {
    if (
      relationshipType === "parent" &&
      person1.death_year < person2.birth_year
    ) {
      errors.push("Parent died before child was born");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Detect potential duplicate people based on name and birth year
 */
export const detectDuplicates = (
  newPerson: Partial<FamilyMember>,
  data: { [id: string]: FamilyMember }
): FamilyMember[] => {
  return Object.values(data).filter(
    (existing) =>
      existing.name?.toLowerCase() === newPerson.name?.toLowerCase() &&
      existing.birth_year === newPerson.birth_year
  );
};

/**
 * Comprehensive data validation for family tree integrity
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'orphaned_reference' | 'circular_relationship' | 'invalid_relationship' | 'missing_data';
  personId: string;
  relatedPersonId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'age_inconsistency' | 'missing_spouse_reciprocal' | 'large_age_gap' | 'potential_duplicate';
  personId: string;
  relatedPersonId?: string;
  message: string;
}

/**
 * Validate the entire family tree data structure
 */
export const validateFamilyTreeData = (data: { [id: string]: FamilyMember }): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check each person's relationships
  Object.values(data).forEach(person => {
    // Validate parent references
    person.parents?.forEach(parentId => {
      if (!data[parentId]) {
        errors.push({
          type: 'orphaned_reference',
          personId: person.id,
          relatedPersonId: parentId,
          message: `${person.name} references non-existent parent: ${parentId}`,
          severity: 'error'
        });
      } else {
        // Check reciprocal relationship
        const parent = data[parentId];
        if (!parent.children?.includes(person.id)) {
          warnings.push({
            type: 'missing_spouse_reciprocal',
            personId: person.id,
            relatedPersonId: parentId,
            message: `Parent ${parent.name} doesn't list ${person.name} as child`
          });
        }
        
        // Age validation
        if (parent.birth_year >= person.birth_year) {
          errors.push({
            type: 'invalid_relationship',
            personId: person.id,
            relatedPersonId: parentId,
            message: `Parent ${parent.name} (${parent.birth_year}) cannot be born same year or after child ${person.name} (${person.birth_year})`,
            severity: 'error'
          });
        }
      }
    });
    
    // Validate children references
    person.children?.forEach(childId => {
      if (!data[childId]) {
        errors.push({
          type: 'orphaned_reference',
          personId: person.id,
          relatedPersonId: childId,
          message: `${person.name} references non-existent child: ${childId}`,
          severity: 'error'
        });
      } else {
        // Check reciprocal relationship
        const child = data[childId];
        if (!child.parents?.includes(person.id)) {
          warnings.push({
            type: 'missing_spouse_reciprocal',
            personId: person.id,
            relatedPersonId: childId,
            message: `Child ${child.name} doesn't list ${person.name} as parent`
          });
        }
      }
    });
    
    // Validate spouse references
    person.spouses?.forEach(spouseId => {
      if (!data[spouseId]) {
        errors.push({
          type: 'orphaned_reference',
          personId: person.id,
          relatedPersonId: spouseId,
          message: `${person.name} references non-existent spouse: ${spouseId}`,
          severity: 'error'
        });
      } else {
        // Check reciprocal relationship
        const spouse = data[spouseId];
        if (!spouse.spouses?.includes(person.id)) {
          warnings.push({
            type: 'missing_spouse_reciprocal',
            personId: person.id,
            relatedPersonId: spouseId,
            message: `Spouse ${spouse.name} doesn't list ${person.name} as spouse`
          });
        }
      }
    });
    
    // Check for circular relationships (person being their own ancestor/descendant)
    if (isCircularRelationship(person.id, data)) {
      errors.push({
        type: 'circular_relationship',
        personId: person.id,
        message: `${person.name} has circular family relationships`,
        severity: 'error'
      });
    }
    
    // Check for potential duplicates
    const duplicates = detectDuplicates(person, data).filter(p => p.id !== person.id);
    if (duplicates.length > 0) {
      warnings.push({
        type: 'potential_duplicate',
        personId: person.id,
        message: `${person.name} might be duplicate of: ${duplicates.map(d => d.name).join(', ')}`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Check if a person has circular relationships (is their own ancestor/descendant)
 */
function isCircularRelationship(personId: string, data: { [id: string]: FamilyMember }): boolean {
  const visited = new Set<string>();
  
  function checkAncestors(currentId: string): boolean {
    if (visited.has(currentId)) return currentId === personId;
    visited.add(currentId);
    
    const person = data[currentId];
    if (!person) return false;
    
    return person.parents?.some(parentId => checkAncestors(parentId)) || false;
  }
  
  function checkDescendants(currentId: string): boolean {
    if (visited.has(currentId)) return currentId === personId;
    visited.add(currentId);
    
    const person = data[currentId];
    if (!person) return false;
    
    return person.children?.some(childId => checkDescendants(childId)) || false;
  }
  
  // Check if person is their own ancestor
  visited.clear();
  if (data[personId]?.parents?.some(parentId => checkAncestors(parentId))) {
    return true;
  }
  
  // Check if person is their own descendant
  visited.clear();
  if (data[personId]?.children?.some(childId => checkDescendants(childId))) {
    return true;
  }
  
  return false;
}

/**
 * Auto-fix common relationship inconsistencies
 */
export const autoFixRelationships = (data: { [id: string]: FamilyMember }): { [id: string]: FamilyMember } => {
  const fixedData = JSON.parse(JSON.stringify(data)); // Deep clone
  
  Object.values(fixedData).forEach(person => {
    // Fix missing reciprocal parent-child relationships
    person.parents?.forEach(parentId => {
      const parent = fixedData[parentId];
      if (parent && !parent.children?.includes(person.id)) {
        parent.children = [...(parent.children || []), person.id];
      }
    });
    
    // Fix missing reciprocal child-parent relationships
    person.children?.forEach(childId => {
      const child = fixedData[childId];
      if (child && !child.parents?.includes(person.id)) {
        child.parents = [...(child.parents || []), person.id];
      }
    });
    
    // Fix missing reciprocal spouse relationships
    person.spouses?.forEach(spouseId => {
      const spouse = fixedData[spouseId];
      if (spouse && !spouse.spouses?.includes(person.id)) {
        spouse.spouses = [...(spouse.spouses || []), person.id];
      }
    });
  });
  
  return fixedData;
};

/**
 * Compare two family tree datasets and identify differences
 */
export const compareTreeData = (
  data1: { [id: string]: FamilyMember },
  data2: { [id: string]: FamilyMember }
): {
  added: FamilyMember[];
  removed: FamilyMember[];
  modified: { person: FamilyMember; changes: string[] }[];
} => {
  const ids1 = new Set(Object.keys(data1));
  const ids2 = new Set(Object.keys(data2));
  
  const added: FamilyMember[] = [];
  const removed: FamilyMember[] = [];
  const modified: { person: FamilyMember; changes: string[] }[] = [];
  
  // Find added people
  ids2.forEach(id => {
    if (!ids1.has(id)) {
      added.push(data2[id]);
    }
  });
  
  // Find removed people
  ids1.forEach(id => {
    if (!ids2.has(id)) {
      removed.push(data1[id]);
    }
  });
  
  // Find modified people
  ids1.forEach(id => {
    if (ids2.has(id)) {
      const person1 = data1[id];
      const person2 = data2[id];
      const changes: string[] = [];
      
      if (person1.name !== person2.name) changes.push('name');
      if (person1.gender !== person2.gender) changes.push('gender');
      if (person1.birth_year !== person2.birth_year) changes.push('birth_year');
      if (person1.death_year !== person2.death_year) changes.push('death_year');
      
      // Compare arrays
      const parentsChanged = JSON.stringify(person1.parents?.sort()) !== JSON.stringify(person2.parents?.sort());
      const spousesChanged = JSON.stringify(person1.spouses?.sort()) !== JSON.stringify(person2.spouses?.sort());
      const childrenChanged = JSON.stringify(person1.children?.sort()) !== JSON.stringify(person2.children?.sort());
      
      if (parentsChanged) changes.push('parents');
      if (spousesChanged) changes.push('spouses');
      if (childrenChanged) changes.push('children');
      
      if (changes.length > 0) {
        modified.push({ person: person2, changes });
      }
    }
  });
  
  return { added, removed, modified };
};