import * as d3 from "d3";
import { FamilyTree, TreeNodeData } from "../types";

interface CalculateTreeParams {
  data: FamilyTree;
  mainId: string;
  nodeSeparation: number;
  levelSeparation: number;
}

export function calculateTree({
  data,
  mainId,
  nodeSeparation,
  levelSeparation,
}: CalculateTreeParams): TreeNodeData[] {
  const nodes: TreeNodeData[] = [];
  const visited = new Set<string>();
  const positions = new Map<
    string,
    { x: number; y: number; generation: number }
  >();

  // Calculate generations
  const calculateGeneration = (memberId: string, generation = 0): number => {
    const member = data.members[memberId];
    if (!member || visited.has(memberId)) return generation;

    visited.add(memberId);
    let maxGeneration = generation;

    if (member.children) {
      member.children.forEach((childId) => {
        const childGeneration = calculateGeneration(childId, generation + 1);
        maxGeneration = Math.max(maxGeneration, childGeneration);
      });
    }

    return maxGeneration;
  };

  // Create hierarchy for D3
  const createHierarchy = (memberId: string): d3.HierarchyNode<any> | null => {
    const member = data.members[memberId];
    if (!member) return null;

    const children = member.children
      ? member.children
          .map(createHierarchy)
          .filter((node): node is d3.HierarchyNode<any> => node !== null)
      : [];

    return d3.hierarchy(
      member,
      (d) => d.children?.map((id) => data.members[id]) || []
    );
  };

  // Create D3 tree layout
  const treeLayout = d3
    .tree<TreeNodeData>()
    .nodeSize([nodeSeparation, levelSeparation])
    .separation((a, b) => {
      // Custom separation logic
      if (a.data.isPlaceholder || b.data.isPlaceholder) return 2;
      if (a.data.type === "spouse" || b.data.type === "spouse") return 1.5;
      return 1;
    });

  // Start from root and create initial hierarchy
  const root = createHierarchy(mainId);
  if (!root) return nodes;

  // Apply D3 tree layout
  const treeData = treeLayout(root);

  // Convert D3 hierarchy to our node format
  const processNode = (
    node: d3.HierarchyNode<any>,
    generation: number,
    level: number
  ) => {
    const member = node.data;
    const treeNode: TreeNodeData = {
      id: member.id,
      name: member.name,
      gender: member.gender,
      birth_year: member.birth_year,
      death_year: member.death_year,
      image: member.image,
      level,
      generation,
      x: (node.x ?? 0) + nodeSeparation,
      y: node.y ?? 0,
      width: 160,
      height: 70,
      xOff: 0,
      yOff: 0,
      children: [],
      parents: [],
      spouses: [],
    };

    nodes.push(treeNode);

    // Process children
    if (node.children) {
      node.children.forEach((child) => {
        processNode(child, generation + 1, level + 1);
      });
    }

    // Add spouse placeholders
    if (!member.spouses || member.spouses.length === 0) {
      const spouseNode: TreeNodeData = {
        id: `${member.id}-spouse-placeholder`,
        name: "Add Spouse",
        gender: member.gender === "male" ? "female" : "male",
        birth_year: member.birth_year,
        isPlaceholder: true,
        type: "spouse",
        targetId: member.id,
        level,
        generation,
        x: (node.x ?? 0) + nodeSeparation,
        y: node.y ?? 0,
        width: 160,
        height: 70,
        xOff: 0,
        yOff: 0,
      };
      nodes.push(spouseNode);
    }

    return treeNode;
  };

  processNode(treeData, 0, 0);

  // Add parent placeholders
  Object.values(data.members).forEach((member) => {
    if (!member.parents || member.parents.length === 0) {
      const memberNode = nodes.find((n) => n.id === member.id);
      if (memberNode) {
        const parentNode: TreeNodeData = {
          id: `${member.id}-parent-placeholder`,
          name: "Add Parent",
          gender: "male",
          birth_year: member.birth_year - 30,
          isPlaceholder: true,
          type: "parent",
          targetId: member.id,
          level: memberNode.level - 1,
          generation: memberNode.generation - 1,
          x: memberNode.x ?? 0,
          y: (memberNode.y ?? 0) - levelSeparation,
          width: 160,
          height: 70,
          xOff: 0,
          yOff: 0,
        };
        nodes.push(parentNode);
      }
    }
  });

  return nodes;
}
