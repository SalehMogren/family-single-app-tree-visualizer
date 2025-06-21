// Types for the tree editor system

/**
 * @interface FamilyMember
 * @description Represents a single person in the family.
 */
export interface FamilyMember {
  id: string;
  name: string;
  gender: "male" | "female";
  birth_year: number;
  death_year?: number;
  parents?: string[];
  spouses?: string[];
  children?: string[];
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
  data: { [id: string]: FamilyMember };
  tree: TreeNodeData[];
  mainId: string;
  focusNodeId: string | null;
  nodeSeparation: number;
  levelSeparation: number;
  showSpouses: boolean;
  past: Array<{ data: { [id: string]: FamilyMember }; tree: TreeNodeData[] }>;
  future: Array<{ data: { [id: string]: FamilyMember }; tree: TreeNodeData[] }>;
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
  relationType: "parent" | "spouse" | "child" | null;
  tree: TreeNodeData[];
  placeholders: PlaceholderNode[];
}
