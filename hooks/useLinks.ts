import { useMemo } from "react";
import {
  TreeNodeData,
  LinkData,
  FamilyMember,
  RelationshipConnection,
} from "../lib/types";
import { BaseTreeSettings } from "@/components/tree/BaseTree";

/**
 * Creates an SVG path string for a smooth, curved link between two points.
 * This is used for parent-child relationships.
 */
function createElbowPath(
  source: { x: number; y: number },
  target: { x: number; y: number }
): string {
  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;

  const dx = tx - sx;
  const dy = ty - sy;

  // If points are very close, draw a straight line
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  // For vertical parent-child relationships
  if (Math.abs(dx) < 50) {
    // Straight vertical line
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  // For angled parent-child relationships, create an L-shaped path
  const midY = sy + (ty - sy) * 0.7; // 70% of the way down

  return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
}

/**
 * A custom hook that generates an array of links (lines) to be drawn on the tree.
 * It creates links for parent-child, spouse, and sibling relationships.
 *
 * @param nodes - A flat array of all nodes currently displayed in the tree.
 * @param data - The raw dictionary of all family members, used for looking up relationships.
 * @param settings - The tree settings, used for card dimensions.
 * @returns An array of LinkData objects, each describing an SVG path to be rendered.
 */
export function useLinks(
  nodes: TreeNodeData[],
  data: { [id: string]: FamilyMember },
  settings: BaseTreeSettings,
  relationships: RelationshipConnection[] // <-- add this argument
): LinkData[] {
  return useMemo(() => {
    if (!Array.isArray(nodes) || !settings || nodes.length === 0) {
      return [];
    }
    const links: LinkData[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const processedRelationships = new Set<string>();
    const cardWidth = settings.cardWidth;
    const cardHeight = settings.cardHeight;
    const addUniqueLink = (link: LinkData) => {
      if (!links.find((l) => l.id === link.id)) {
        links.push(link);
      }
    };
    const getConnectionPoints = (
      node1: TreeNodeData,
      node2: TreeNodeData,
      relationshipType: string
    ) => {
      const node1Center = { x: node1.x, y: node1.y };
      const node2Center = { x: node2.x, y: node2.y };

      if (relationshipType === "spouse") {
        // Horizontal connection between spouses
        if (node1.x < node2.x) {
          return {
            start: { x: node1Center.x + cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x - cardWidth / 2, y: node2Center.y },
          };
        } else {
          return {
            start: { x: node1Center.x - cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x + cardWidth / 2, y: node2Center.y },
          };
        }
      } else if (relationshipType === "parent") {
        // Vertical connection from parent to child
        if (node1.y < node2.y) {
          // node1 is parent, node2 is child
          return {
            start: { x: node1Center.x, y: node1Center.y + cardHeight / 2 },
            end: { x: node2Center.x, y: node2Center.y - cardHeight / 2 },
          };
        } else {
          // node2 is parent, node1 is child
          return {
            start: { x: node2Center.x, y: node2Center.y + cardHeight / 2 },
            end: { x: node1Center.x, y: node1Center.y - cardHeight / 2 },
          };
        }
      } else if (relationshipType === "sibling") {
        // Horizontal connection between siblings
        if (node1.x < node2.x) {
          return {
            start: { x: node1Center.x + cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x - cardWidth / 2, y: node2Center.y },
          };
        } else {
          return {
            start: { x: node1Center.x - cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x + cardWidth / 2, y: node2Center.y },
          };
        }
      }

      // Default: center to center
      return {
        start: node1Center,
        end: node2Center,
      };
    };
    // Generate links from relationships array
    relationships.forEach((rel) => {
      if (!nodeMap.has(rel.fromId) || !nodeMap.has(rel.toId)) return;
      const node1 = nodeMap.get(rel.fromId)!;
      const node2 = nodeMap.get(rel.toId)!;
      let relationshipType = rel.type;
      let linkType: "ancestry" | "spouse" | "progeny" = "ancestry";
      if (rel.type === "spouse") linkType = "spouse";
      // For siblings, use 'ancestry' as the type to match LinkData
      if (rel.type === "sibling") linkType = "ancestry";
      const relationshipKey = `${rel.type}-${rel.fromId}-${rel.toId}`;
      if (processedRelationships.has(relationshipKey)) return;
      processedRelationships.add(relationshipKey);
      const connectionPoints = getConnectionPoints(node1, node2, rel.type);
      addUniqueLink({
        id: relationshipKey,
        d:
          rel.type === "parent"
            ? createElbowPath(connectionPoints.start, connectionPoints.end)
            : `M ${connectionPoints.start.x} ${connectionPoints.start.y} L ${connectionPoints.end.x} ${connectionPoints.end.y}`,
        type: linkType,
        depth: rel.type === "parent" ? 1 : 0,
        curve: rel.type === "parent" ? "curved" : "straight",
        personIds: [rel.fromId, rel.toId],
        relationshipType: rel.type,
      });
      // For bidirectional relationships, add the reverse link only once
      if (
        rel.bidirectional &&
        !processedRelationships.has(`${rel.type}-${rel.toId}-${rel.fromId}`)
      ) {
        processedRelationships.add(`${rel.type}-${rel.toId}-${rel.fromId}`);
      }
    });
    return links;
  }, [nodes, data, settings, relationships]);
}

export function getLinkColor(
  linkType: "ancestry" | "progeny" | "spouse",
  isDarkMode = false
) {
  const colors = {
    ancestry: isDarkMode ? "#60A5FA" : "#3B82F6", // Blue
    progeny: isDarkMode ? "#34D399" : "#10B981", // Green
    spouse: isDarkMode ? "#F472B6" : "#EC4899", // Pink
  };

  return colors[linkType];
}

export function getLinkStrokeWidth(
  linkType: "ancestry" | "progeny" | "spouse"
) {
  const widths = {
    ancestry: 3,
    progeny: 2,
    spouse: 2,
  };

  return widths[linkType];
}
