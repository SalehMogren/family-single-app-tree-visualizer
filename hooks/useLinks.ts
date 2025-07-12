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
  settings: BaseTreeSettings
): LinkData[] {
  return useMemo(() => {
    if (!Array.isArray(nodes) || !settings || nodes.length === 0) {
      return [];
    }
    
    console.log(`[useLinks] Processing ${nodes.length} nodes for link generation`);
    
    const links: LinkData[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const processedRelationships = new Set<string>(); // Track all processed relationships
    
    // Card dimensions for proper connection points
    const cardWidth = settings.cardWidth;
    const cardHeight = settings.cardHeight;

    // Helper function to add link with duplicate check
    const addUniqueLink = (link: LinkData) => {
      const existingLink = links.find(l => l.id === link.id);
      if (!existingLink) {
        links.push(link);
        console.log(`[useLinks] Added link: ${link.id} (${link.relationshipType})`);
      }
    };
    
    // Helper function to get connection points for nodes
    const getConnectionPoints = (node1: TreeNodeData, node2: TreeNodeData, relationshipType: string) => {
      const node1Center = { x: node1.x, y: node1.y };
      const node2Center = { x: node2.x, y: node2.y };
      
      if (relationshipType === 'spouse') {
        // Horizontal connection between spouses
        if (node1.x < node2.x) {
          return {
            start: { x: node1Center.x + cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x - cardWidth / 2, y: node2Center.y }
          };
        } else {
          return {
            start: { x: node1Center.x - cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x + cardWidth / 2, y: node2Center.y }
          };
        }
      } else if (relationshipType === 'parent') {
        // Vertical connection from parent to child
        if (node1.y < node2.y) {
          // node1 is parent, node2 is child
          return {
            start: { x: node1Center.x, y: node1Center.y + cardHeight / 2 },
            end: { x: node2Center.x, y: node2Center.y - cardHeight / 2 }
          };
        } else {
          // node2 is parent, node1 is child
          return {
            start: { x: node2Center.x, y: node2Center.y + cardHeight / 2 },
            end: { x: node1Center.x, y: node1Center.y - cardHeight / 2 }
          };
        }
      } else if (relationshipType === 'sibling') {
        // Horizontal connection between siblings
        if (node1.x < node2.x) {
          return {
            start: { x: node1Center.x + cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x - cardWidth / 2, y: node2Center.y }
          };
        } else {
          return {
            start: { x: node1Center.x - cardWidth / 2, y: node1Center.y },
            end: { x: node2Center.x + cardWidth / 2, y: node2Center.y }
          };
        }
      }
      
      // Default: center to center
      return {
        start: node1Center,
        end: node2Center
      };
    };

    // 1. Process ALL spouse relationships first
    nodes.forEach((node) => {
      const person = data[node.id];
      if (!person?.spouses) return;

      person.spouses.forEach((spouseId) => {
        const spouseNode = nodeMap.get(spouseId);
        if (!spouseNode) return;
        
        // Create unique relationship key (process each pair only once)
        const relationshipKey = `spouse-${node.id < spouseId ? node.id : spouseId}-${node.id < spouseId ? spouseId : node.id}`;
        if (processedRelationships.has(relationshipKey)) return;
        processedRelationships.add(relationshipKey);
        
        // Get proper connection points
        const connectionPoints = getConnectionPoints(node, spouseNode, 'spouse');
        
        // Create spouse link
        addUniqueLink({
          id: relationshipKey,
          d: `M ${connectionPoints.start.x} ${connectionPoints.start.y} L ${connectionPoints.end.x} ${connectionPoints.end.y}`,
          type: "spouse",
          depth: 0,
          curve: "straight",
          personIds: [node.id, spouseId],
          relationshipType: "spouse",
        });
      });
    });

    // 2. Process ALL parent-child relationships
    nodes.forEach((node) => {
      const person = data[node.id];
      if (!person) return;

      // Process children (parent -> child connections)
      if (person.children) {
        person.children.forEach((childId) => {
          const childNode = nodeMap.get(childId);
          if (!childNode) return;
          
          const relationshipKey = `parent-${node.id}-${childId}`;
          if (processedRelationships.has(relationshipKey)) return;
          processedRelationships.add(relationshipKey);
          
          // Get proper connection points
          const connectionPoints = getConnectionPoints(node, childNode, 'parent');
          
          // Create parent-child link
          addUniqueLink({
            id: relationshipKey,
            d: createElbowPath(connectionPoints.start, connectionPoints.end),
            type: "ancestry",
            depth: 1,
            curve: "curved",
            personIds: [node.id, childId],
            relationshipType: "parent",
          });
        });
      }

      // Process parents (child -> parent connections, to catch any missed from parent side)
      if (person.parents) {
        person.parents.forEach((parentId) => {
          const parentNode = nodeMap.get(parentId);
          if (!parentNode) return;
          
          const relationshipKey = `parent-${parentId}-${node.id}`;
          if (processedRelationships.has(relationshipKey)) return;
          processedRelationships.add(relationshipKey);
          
          // Get proper connection points
          const connectionPoints = getConnectionPoints(parentNode, node, 'parent');
          
          // Create parent-child link
          addUniqueLink({
            id: relationshipKey,
            d: createElbowPath(connectionPoints.start, connectionPoints.end),
            type: "ancestry",
            depth: 1,
            curve: "curved",
            personIds: [parentId, node.id],
            relationshipType: "parent",
          });
        });
      }
    });
    
    // 3. Process sibling relationships (optional - only for closely positioned siblings)
    nodes.forEach((node) => {
      const person = data[node.id];
      if (!person?.parents) return;
      
      // Find siblings in the tree
      nodes.forEach((otherNode) => {
        if (node.id >= otherNode.id) return; // Process each pair only once
        
        const otherPerson = data[otherNode.id];
        if (!otherPerson?.parents) return;
        
        // Check if they share at least one parent
        const sharedParents = person.parents?.filter(pid => otherPerson.parents?.includes(pid)) || [];
        if (sharedParents.length === 0) return;
        
        const relationshipKey = `sibling-${node.id}-${otherNode.id}`;
        if (processedRelationships.has(relationshipKey)) return;
        
        // Only create sibling links if they're on the same level and close enough
        const distance = Math.abs(otherNode.x - node.x);
        const sameLevel = Math.abs(otherNode.y - node.y) < 50; // Allow small Y differences
        
        if (sameLevel && distance <= cardWidth * 4) {
          processedRelationships.add(relationshipKey);
          
          const connectionPoints = getConnectionPoints(node, otherNode, 'sibling');
          
          addUniqueLink({
            id: relationshipKey,
            d: `M ${connectionPoints.start.x} ${connectionPoints.start.y} L ${connectionPoints.end.x} ${connectionPoints.end.y}`,
            type: "ancestry",
            depth: 0,
            curve: "straight",
            personIds: [node.id, otherNode.id],
            relationshipType: "sibling",
          });
        }
      });
    });

    console.log(`[useLinks] Generated ${links.length} links for ${nodes.length} nodes:`);
    links.forEach(link => {
      console.log(`  - ${link.id}: ${link.relationshipType} (${link.personIds?.join(' -> ')})`);
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