import { useMemo } from "react";
import { TreeNodeData, LinkData } from "../types";

interface UseLinksParams {
  nodes: TreeNodeData[];
  showPlaceholders: boolean;
}

export function useLinks({
  nodes,
  showPlaceholders,
}: UseLinksParams): LinkData[] {
  return useMemo(() => {
    const links: LinkData[] = [];

    // Helper function to create a link path
    const createLinkPath = (
      source: TreeNodeData,
      target: TreeNodeData
    ): string => {
      const sourceX = source.x || 0;
      const sourceY = source.y || 0;
      const targetX = target.x || 0;
      const targetY = target.y || 0;

      // Adjust for node dimensions
      const nodeWidth = 160;
      const nodeHeight = 70;

      let adjustedSourceX = sourceX;
      let adjustedSourceY = sourceY;
      let adjustedTargetX = targetX;
      let adjustedTargetY = targetY;

      // Determine if this is a spouse or parent-child relationship
      const isSpouse = source.generation === target.generation;

      if (isSpouse) {
        // For spouse connections, connect centers horizontally
        if (sourceX < targetX) {
          adjustedSourceX += nodeWidth / 2;
          adjustedTargetX -= nodeWidth / 2;
        } else {
          adjustedSourceX -= nodeWidth / 2;
          adjustedTargetX += nodeWidth / 2;
        }
        return `M${adjustedSourceX},${adjustedSourceY} L${adjustedTargetX},${adjustedTargetY}`;
      } else {
        // For parent-child connections, connect vertically
        adjustedSourceY += nodeHeight / 2;
        adjustedTargetY -= nodeHeight / 2;
        const midY = adjustedSourceY + (adjustedTargetY - adjustedSourceY) / 2;
        return `M${adjustedSourceX},${adjustedSourceY} L${adjustedSourceX},${midY} L${adjustedTargetX},${midY} L${adjustedTargetX},${adjustedTargetY}`;
      }
    };

    // Process each node
    nodes.forEach((node) => {
      // Skip placeholder nodes if not showing placeholders
      if (!showPlaceholders && node.isPlaceholder) return;

      // Find connected nodes
      const connectedNodes = nodes.filter((otherNode) => {
        if (otherNode.id === node.id) return false;
        if (!showPlaceholders && otherNode.isPlaceholder) return false;

        // Check for parent-child relationship
        if (node.targetId === otherNode.id || otherNode.targetId === node.id) {
          return true;
        }

        // Check for spouse relationship
        if (node.generation === otherNode.generation) {
          return (
            node.targetId === otherNode.id || otherNode.targetId === node.id
          );
        }

        return false;
      });

      // Create links for connected nodes
      connectedNodes.forEach((targetNode) => {
        const linkId = `${node.id}-${targetNode.id}`;
        const reverseLinkId = `${targetNode.id}-${node.id}`;

        // Avoid duplicate links
        if (
          !links.some((link) => link.id === linkId || link.id === reverseLinkId)
        ) {
          const isSpouse = node.generation === targetNode.generation;
          const link: LinkData = {
            id: linkId,
            source: node,
            target: targetNode,
            type: isSpouse ? "spouse" : "parent-child",
            d: createLinkPath(node, targetNode),
            curve: isSpouse ? 0 : 0.5,
          };
          links.push(link);
        }
      });
    });

    return links;
  }, [nodes, showPlaceholders]);
}
