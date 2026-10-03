// Types for the tree editor system

/**
 * @interface FamilyMember
 * @description Represents a single person in the family (no relationship arrays).
 */
export interface FamilyMember {
  id: string;
  name: string;
  gender: "male" | "female";
  birth_year: number;
  death_year?: number;
  occupation?: string;
  birthplace?: string;
  notes?: string;
  image?: string;
  imageUrl?: string;
}

/**
 * @interface TreeNodeData
 * @description Represents a node in the tree.
 */
export interface TreeNodeData
  extends Omit<FamilyMember, "parents" | "spouses" | "children"> {
  x: number;
  y: number;
  children?: TreeNodeData[];
  parents?: TreeNodeData[];
  spouses?: TreeNodeData[];
  psx?: number; // Spouse position X
  level?: number; // Hierarchical level in tree
  isAncestry?: boolean;
  isSpouse?: boolean;
  hasSpouse?: boolean;
  isPlaceholder?: boolean;
  type?: "parent" | "spouse" | "child";
  targetId?: string;
}

export interface TreeData {
  data: { [id: string]: FamilyMember };
  tree: TreeNodeData[];
  mainId: string;
}

export interface TreeState {
  /**
   * All family members, keyed by ID.
   */
  members: { [id: string]: FamilyMember };
  /**
   * All relationships between members.
   */
  relationships: RelationshipConnection[];
  /**
   * The hierarchical tree structure for rendering (calculated).
   */
  tree: TreeNodeData[];
  mainId: string;
  focusNodeId: string | null;
  nodeSeparation: number;
  levelSeparation: number;
  // Visual spacing controls for tree layout
  horizontalSpacing: number;
  verticalSpacing: number;
  showSpouses: boolean;
  viewMode: "full" | "focus";
  focusPersonId: string | null;
  // Visual appearance settings
  cardWidth: number;
  cardHeight: number;
  maleColor: string;
  femaleColor: string;
  linkColor: string;
  lineShape: "straight" | "curved";
  // Label visibility toggles
  showLabels: {
    name: boolean;
    birthYear: boolean;
    deathYear: boolean;
    spouse: boolean;
    genderIcon: boolean;
  };
  past: Array<{
    members: { [id: string]: FamilyMember };
    relationships: RelationshipConnection[];
    tree: TreeNodeData[];
  }>;
  future: Array<{
    members: { [id: string]: FamilyMember };
    relationships: RelationshipConnection[];
    tree: TreeNodeData[];
  }>;
}

/**
 * @interface LinkData
 * @description Represents a link between nodes in the tree.
 */
export interface LinkData {
  id: string;
  d: string;
  curve: string;
  depth: number;
  type: "ancestry" | "progeny" | "spouse";
  personIds?: string[]; // Array of connected person IDs
  relationshipType?: "parent" | "spouse" | "child" | "sibling";
}

export interface PlaceholderNode extends Omit<TreeNodeData, "id" | "gender"> {
  id: string;
  isPlaceholder: true;
  type: "parent" | "spouse" | "child";
  targetId: string;
  gender?: "male" | "female";
}

export type TreeAction =
  | { type: "UPDATE_DATA"; payload: { [id: string]: FamilyMember } }
  | { type: "UPDATE_MAIN_ID"; payload: string }
  | {
      type: "UPDATE_DATA_AND_MAIN_ID";
      payload: { data: { [id: string]: FamilyMember }; mainId: string };
    }
  | { type: "RECALCULATE_TREE" }
  | { type: "SET_FOCUS_NODE"; payload: string | null }
  | { type: "SET_NODE_SEPARATION"; payload: number }
  | { type: "SET_LEVEL_SEPARATION"; payload: number }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "TOGGLE_ALL_RELS" }
  | { type: "SAVE_STATE" };

export interface AddRelativeOverlayState {
  isVisible: boolean;
  targetId: string | null;
  relationType: "parent" | "spouse" | "child" | "sibling" | null;
  tree: TreeNodeData[];
  placeholders: PlaceholderNode[];
}

export interface SmartSuggestion {
  id: string;
  type: "parent" | "spouse" | "child" | "sibling";
  label: string;
  description: string;
  priority: "high" | "medium" | "low";
  reason: string;
  targetPersonId: string;
  suggestedPersonId?: string;
  icon: string;
}

/**
 * Represents a relationship between two family members.
 */
export interface RelationshipConnection {
  /**
   * Unique identifier for this relationship connection.
   */
  id: string;

  /**
   * The ID of the source person in the relationship.
   * - For "parent-child", this is the parent.
   * - For "spouse" and "sibling", this can be either person.
   */
  fromId: string;

  /**
   * The ID of the target person in the relationship.
   * - For "parent-child", this is the child.
   * - For "spouse" and "sibling", this can be either person.
   */
  toId: string;

  /**
   * The type of relationship.
   * - "parent": fromId is the parent, toId is the child.
   * - "spouse": fromId and toId are spouses.
   * - "sibling": fromId and toId are siblings.
   */
  type: "parent" | "spouse" | "sibling";

  /**
   * Whether the relationship is bidirectional.
   * - true: The relationship is mutual (e.g., spouse, sibling).
   *   - If A is spouse of B, B is also spouse of A.
   *   - If A is sibling of B, B is also sibling of A.
   * - false: The relationship is directional (e.g., parent-child).
   *   - If A is parent of B, B is not parent of A.
   */
  bidirectional: boolean;

  /**
   * Optional metadata for the relationship.
   * - marriageYear, divorceYear for spouses.
   * - adoptionType for parent-child.
   */
  metadata?: {
    marriageYear?: number;
    divorceYear?: number;
    adoptionType?: "biological" | "adopted" | "step";
  };
}

export interface DragDropContext {
  isDragging: boolean;
  draggedNodeId: string | null;
  dropTargetId: string | null;
  dragType: "relationship" | "position";
  validDropTargets: string[];
}
