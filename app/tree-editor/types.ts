export interface FamilyMember {
  id: string;
  name: string;
  gender: "male" | "female";
  birth_year: number;
  death_year?: number;
  parents?: string[]; // Array of parent IDs
  spouses?: string[]; // Array of spouse IDs
  children?: string[]; // Array of children IDs
  occupation?: string;
  birthplace?: string;
  notes?: string;
  image?: string;
  x?: number;
  y?: number;
  isPlaceholder?: boolean;
}

export interface FamilyTree {
  members: { [id: string]: FamilyMember };
  rootId: string;
}

export interface PlaceholderNode {
  id: string;
  type: "parent" | "spouse" | "child";
  targetId: string;
  isPlaceholder: true;
  gender?: "male" | "female";
  name: string;
  x?: number;
  y?: number;
}

export interface TreeNodeData {
  id: string;
  name: string;
  gender: "male" | "female";
  birth_year: number;
  death_year?: number;
  isPlaceholder?: boolean;
  type?: "parent" | "spouse" | "child";
  targetId?: string;
  image?: string;
  level: number;
  generation: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  xOff?: number;
  yOff?: number;
  children?: TreeNodeData[];
  parents?: TreeNodeData[];
  spouses?: TreeNodeData[];
  psx?: number;
  isAncestry?: boolean;
}

export interface DetailPanelSettings {
  enableDetailView: boolean;
  viewOnly: boolean;
  editOnClick: boolean;
}

export interface FieldConfig {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "image";
  required: boolean;
  editable: boolean;
}

export interface LinkData {
  id: string;
  source: TreeNodeData;
  target: TreeNodeData;
  type: "parent-child" | "spouse";
  d?: string;
  curve?: number;
}
