import React, { useState } from "react";
import { TreeNodeData, FamilyMember } from "../../lib/types";
import {
  User,
  Users,
  MoreHorizontal,
  Move,
  Link2,
  Sparkles,
} from "lucide-react";
import {
  useDraggableNode,
  useDropTargetNode,
} from "../tree-editor/DragDropProvider";

interface NodeCardProps {
  node: TreeNodeData;
  isDarkMode: boolean;
  isSelected: boolean;
  onNodeClick: (node: TreeNodeData) => void;
  onAddRelative: (
    nodeId: string,
    type: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  onRelationshipDrop?: (
    sourceId: string,
    targetId: string,
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  showSuggestionIndicator?: boolean;
  style: React.CSSProperties;
  maleColor: string;
  femaleColor: string;
  showLabels?: {
    name: boolean;
    birthYear: boolean;
    deathYear: boolean;
    spouse: boolean;
    genderIcon: boolean;
  };
  allFamilyData?: { [id: string]: FamilyMember };
}

export function NodeCard({
  node,
  isDarkMode,
  isSelected,
  onNodeClick,
  onAddRelative,
  onRelationshipDrop,
  showSuggestionIndicator = false,
  style,
  maleColor,
  femaleColor,
  showLabels = {
    name: true,
    birthYear: true,
    deathYear: true,
    spouse: true,
    genderIcon: true,
  },
  allFamilyData = {},
}: NodeCardProps) {
  const [showDropMenu, setShowDropMenu] = useState(false);
  const genderColor = node.gender === "male" ? maleColor : femaleColor;
  const textColor = isDarkMode ? "text-gray-100" : "text-white";

  // Drag and Drop functionality
  const { isDraggedNode, dragHandlers } = useDraggableNode(node.id);
  const { isDropTarget, canAcceptDrop, dropHandlers } = useDropTargetNode(
    node.id,
    (sourceId, targetId, relationshipType) => {
      if (onRelationshipDrop) {
        onRelationshipDrop(sourceId, targetId, relationshipType);
      }
    }
  );

  // Get Tailwind classes for background and border colors
  const getBackgroundClass = () => {
    return node.gender === "male" ? "bg-tree-male" : "bg-tree-female";
  };

  const getBorderClass = () => {
    if (isSelected) {
      return "border-ring";
    } else if (isDropTarget) {
      return "border-primary";
    } else {
      return node.gender === "male" ? "border-tree-male" : "border-tree-female";
    }
  };

  const cardStyle: React.CSSProperties = {
    ...style,
    boxShadow: isSelected
      ? `0 0 16px ${genderColor}`
      : isDropTarget
      ? `0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.4)`
      : isDraggedNode
      ? `0 8px 25px rgba(0,0,0,0.2)`
      : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    opacity: isDraggedNode ? 0.8 : 1,
    transform: isDraggedNode ? "rotate(2deg) scale(1.02)" : isDropTarget ? "scale(1.05)" : "none",
    transition: "all 0.2s ease-in-out",
  };

  if (!node || !node.id) {
    return null; // Don't render if node data is incomplete
  }



  const handleRelationshipDrop = (
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => {
    setShowDropMenu(false);
    // This will be handled by the drop handlers
  };


  return (
    <div
      data-testid="node-card"
      style={{ ...cardStyle, overflow: "visible" }}
      className={`cursor-pointer group rounded-lg transition-all duration-300 border-2 ${getBackgroundClass()} ${getBorderClass()} ${
        canAcceptDrop ? "ring-2 ring-blue-400 ring-opacity-50" : ""
      } ${isDraggedNode ? "cursor-grabbing" : "cursor-grab"}`}
      onClick={() => onNodeClick(node)}
      {...dragHandlers}
      {...dropHandlers}>
      {/* Drag indicator */}
      {isDraggedNode && (
        <div className='absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'>
          <Move size={12} className='text-white' />
        </div>
      )}

      {/* Drop indicator */}
      {isDropTarget && (
        <div className='absolute inset-0 bg-blue-400 bg-opacity-20 rounded-lg border-2 border-blue-400 border-dashed animate-pulse'>
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
            <Link2 className='w-6 h-6 text-blue-600' />
          </div>
        </div>
      )}

      {/* Suggestion indicator */}
      {showSuggestionIndicator && !isSelected && (
        <div className='absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse'>
          <Sparkles className='w-2 h-2 text-white' />
        </div>
      )}

      <div
        className={`w-full h-full flex flex-col items-center justify-center p-2 gap-1 ${textColor}`}>
        <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0'>
          <img
            src={node.imageUrl || "/placeholder-user.jpg"}
            alt={node.name}
            className='w-full h-full object-cover'
          />
        </div>
        <div className='text-center'>
          {showLabels.name && (
            <p className='text-sm font-bold truncate'>{node.name || "Unknown"}</p>
          )}
          {(showLabels.birthYear || showLabels.deathYear) && (
            <p className='text-xs opacity-90'>
              {showLabels.birthYear && node.birth_year}
              {showLabels.birthYear && showLabels.deathYear && node.death_year && " - "}
              {showLabels.deathYear && node.death_year}
            </p>
          )}
        </div>
      </div>


    </div>
  );
}
