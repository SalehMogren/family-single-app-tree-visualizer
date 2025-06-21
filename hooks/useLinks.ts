import { useMemo } from "react";
import { TreeNodeData, LinkData, FamilyMember } from "../lib/types";
import { BaseTreeSettings } from "@/components/tree/BaseTree";

/**
 * Creates an SVG path string for a smooth, curved link between two points.
 * This is used for parent-child relationships.
 */
function createElbowPath(
  source: { x: number; y: number },
  target: { x: number; y: number }
): string {
  const radius = 20;
  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;

  const dx = tx - sx;
  const dy = ty - sy;

  // If points are too close, draw a straight line
  if (Math.abs(dx) < radius * 2 || Math.abs(dy) < radius * 2) {
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  const xSign = dx > 0 ? 1 : -1;
  const ySign = dy > 0 ? 1 : -1;

  // Path with one bend: vertical then horizontal
  return `M ${sx},${sy} L ${sx},${
    ty - radius * ySign
  } A ${radius},${radius} 0 0 ${xSign * ySign > 0 ? 1 : 0} ${
    sx + radius * xSign
  },${ty} L ${tx},${ty}`;
}

/**
 * A custom hook that generates an array of links (lines) to be drawn on the tree.
 * It creates links for parent-child, child-parent (ancestor), and spousal relationships.
 *
 * @param nodes - A flat array of all nodes currently displayed in the tree.
 * @param data - The raw dictionary of all family members, used for looking up relationships.
 * @param settings - The tree settings, used for card dimensions.
 * @returns An array of LinkData objects, each describing an SVG path to be rendered.
 */
export function useLinks(
  nodes: TreeNodeData[],
  data: { [id: string]: FamilyMember },
  settings: BaseTreeSettings
): LinkData[] {
  return useMemo(() => {
    if (!Array.isArray(nodes) || !settings) {
      return [];
    }
    const links: LinkData[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const processedChildren = new Set<string>(); // Track children linked via a family unit

    // 1. Process couples and draw their family-to-children links
    nodes.forEach((node) => {
      const person = data[node.id];
      if (!person || !person.spouses) return;

      person.spouses.forEach((spouseId) => {
        const spouseNode = nodeMap.get(spouseId);
        // Process each couple once to avoid duplicate links
        if (!spouseNode || node.id > spouseNode.id) return;

        const p1 = node;
        const p2 = spouseNode;
        // Find common children who are visible in the tree
        const childrenOfP1 = new Set(person.children || []);
        const commonChildrenIds = (data[spouseId]?.children || []).filter(
          (id) => childrenOfP1.has(id)
        );
        const childrenNodes = commonChildrenIds
          .map((id) => nodeMap.get(id))
          .filter((cn): cn is TreeNodeData => !!cn);

        if (childrenNodes.length === 0) return;

        // Mark these children as handled
        childrenNodes.forEach((cn) => processedChildren.add(cn.id));

        const parentMidPoint = { x: (p1.x + p2.x) / 2, y: p1.y };
        const junctionY =
          parentMidPoint.y + (childrenNodes[0].y - parentMidPoint.y) / 2;

        // Vertical stem from parents' midpoint
        links.push({
          id: `stem-${p1.id}-${p2.id}`,
          d: `M ${parentMidPoint.x} ${parentMidPoint.y} L ${parentMidPoint.x} ${junctionY}`,
          type: "ancestry",
          depth: 1,
          curve: "straight",
        });

        // Horizontal "bus" line, extends to connect the stem and all children
        const allChildX = childrenNodes.map((c) => c.x);
        const busMinX = Math.min(...allChildX);
        const busMaxX = Math.max(...allChildX);

        links.push({
          id: `bus-${p1.id}-${p2.id}`,
          d: `M ${busMinX} ${junctionY} L ${busMaxX} ${junctionY}`,
          type: "ancestry",
          depth: 1,
          curve: "straight",
        });

        // Vertical connectors from bus/junction to each child
        childrenNodes.forEach((childNode) => {
          const radius = 10;
          const childX = childNode.x;
          const childY = childNode.y - settings.cardHeight / 2;
          const xSign = childX > parentMidPoint.x ? 1 : -1;

          let path;
          // Path from parent mid-point stem to child
          if (Math.abs(childX - parentMidPoint.x) > radius) {
            path = `M ${parentMidPoint.x},${junctionY} L ${
              childX - radius * xSign
            },${junctionY} A ${radius},${radius} 0 0 ${
              xSign > 0 ? 1 : 0
            } ${childX},${junctionY + radius} L ${childX},${childY}`;
          } else {
            // Straight down if child is aligned with parent midpoint
            path = `M ${childX},${junctionY} L ${childX},${childY}`;
          }

          links.push({
            id: `connector-${childNode.id}`,
            d: path,
            type: "ancestry",
            depth: 1,
            curve: "curved",
          });
        });
      });
    });

    // 2. Process remaining links (single parents and spouses)
    nodes.forEach((node) => {
      const person = data[node.id];
      if (!person) return;

      // Spouse links (this connects the parents from step 1)
      if (person.spouses) {
        person.spouses.forEach((spouseId) => {
          const spouseNode = nodeMap.get(spouseId);
          if (spouseNode && node.id < spouseNode.id) {
            links.push({
              id: `spouse-${node.id}-${spouseId}`,
              d: `M ${node.x} ${node.y} L ${spouseNode.x} ${spouseNode.y}`,
              type: "spouse",
              depth: 0,
              curve: "straight",
            });
          }
        });
      }

      // Children who weren't processed (i.e., from single parents)
      if (!processedChildren.has(node.id) && person.parents) {
        const parentNodes = person.parents
          .map((pId) => nodeMap.get(pId))
          .filter((p): p is TreeNodeData => !!p);

        if (parentNodes.length === 1) {
          const p1 = parentNodes[0];
          const sourcePoint = { x: p1.x, y: p1.y + settings.cardHeight / 2 };
          const targetPoint = {
            x: node.x,
            y: node.y - settings.cardHeight / 2,
          };
          const midY = sourcePoint.y + (targetPoint.y - sourcePoint.y) / 2;

          // Simple elbow path for single parents
          links.push({
            id: `link-${p1.id}-${node.id}`,
            d: createElbowPath(sourcePoint, targetPoint),
            type: "ancestry",
            depth: 1,
            curve: "curved",
          });
        }
      }
    });

    return links;
  }, [nodes, data, settings]);
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
