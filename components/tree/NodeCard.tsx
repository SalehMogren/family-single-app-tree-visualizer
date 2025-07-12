import React, { useState } from "react";
import { TreeNodeData } from "../../lib/types";
import {
  User,
  Users,
  Plus,
  MoreHorizontal,
  Heart,
  Baby,
  Users2,
  UserPlus,
  Crown,
  Move,
  Link2,
  Sparkles
} from "lucide-react";
import { useDraggableNode, useDropTargetNode } from '../tree-editor/DragDropProvider';

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
    relationshipType: 'parent' | 'spouse' | 'child' | 'sibling'
  ) => void;
  showSuggestionIndicator?: boolean;
  style: React.CSSProperties;
  maleColor: string;
  femaleColor: string;
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
  allFamilyData = {},
}: NodeCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
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

  const cardStyle: React.CSSProperties = {
    ...style,
    backgroundColor: genderColor,
    borderColor: isSelected ? "hsl(var(--yellow-400))" : 
                isDropTarget ? "hsl(var(--blue-400))" : genderColor,
    boxShadow: isSelected
      ? `0 0 12px ${genderColor}`
      : isDropTarget
      ? `0 0 12px hsl(var(--blue-400))`
      : isDraggedNode
      ? `0 0 8px rgba(0,0,0,0.3)`
      : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    opacity: isDraggedNode ? 0.7 : 1,
    transform: isDraggedNode ? 'rotate(5deg) scale(1.05)' : 'none',
  };

  if (!node || !node.id) {
    return null; // Don't render if node data is incomplete
  }

  const handleAddRelative = (
    e: React.MouseEvent,
    type: "parent" | "spouse" | "child" | "sibling"
  ) => {
    e.stopPropagation();
    onAddRelative(node.id, type);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowQuickActions(true);
  };

  const handleRelationshipDrop = (relationshipType: 'parent' | 'spouse' | 'child' | 'sibling') => {
    setShowDropMenu(false);
    // This will be handled by the drop handlers
  };

  // Helper functions to check if relatives already exist
  const hasParents = () => {
    return node.parents && node.parents.length >= 2; // Usually max 2 parents
  };

  const hasSpouse = () => {
    return node.spouses && node.spouses.length > 0;
  };

  const hasChildren = () => {
    return node.children && node.children.length > 0;
  };

  const hasSiblings = () => {
    if (!node.parents || node.parents.length === 0) return false;
    // Check if any parent has more than one child
    return node.parents.some(parentId => {
      const parent = allFamilyData[parentId];
      return parent && parent.children && parent.children.length > 1;
    });
  };

  // Check if we should show the button based on existing relationships
  const shouldShowButton = (type: "parent" | "spouse" | "child" | "sibling") => {
    switch (type) {
      case "parent":
        return !hasParents();
      case "spouse":
        return !hasSpouse();
      case "child":
        return true; // Always allow adding children
      case "sibling":
        return node.parents && node.parents.length > 0; // Can only add siblings if person has parents
      default:
        return true;
    }
  };

  return (
    <div
      style={{ ...cardStyle, overflow: 'visible' }}
      className={`cursor-pointer group rounded-lg transition-all duration-300 border-2 ${
        canAcceptDrop ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      } ${isDraggedNode ? 'cursor-grabbing' : 'cursor-grab'}`}
      onClick={() => onNodeClick(node)}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setShowQuickActions(false)}
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
          <p className='text-sm font-bold truncate'>{node.name || "Unknown"}</p>
          <p className='text-xs opacity-90'>
            {node.birth_year}
            {node.death_year ? ` - ${node.death_year}` : ""}
          </p>
        </div>
      </div>

      {/* NodeCard-like Add Actions with Connecting Lines */}
      {(isSelected || showQuickActions) && (
        <>
          {/* Add Parent - Top (Mini NodeCard with connection line) */}
          {shouldShowButton("parent") && (
            <div className='absolute -top-14 left-1/2 -translate-x-1/2 z-10'>
              {/* Connection line from main node to parent button */}
              <div className='absolute top-8 left-1/2 w-0.5 h-6 bg-gray-400 dark:bg-gray-500 -translate-x-1/2'></div>
              <button
                onClick={(e) => handleAddRelative(e, "parent")}
                className='w-16 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex flex-col items-center justify-center text-white shadow-lg hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-105 hover:shadow-xl border border-white/20 relative'
                title='Add Parent'
                aria-label='Add parent'>
                <div className='w-4 h-4 rounded-full bg-white/30 flex items-center justify-center mb-0.5'>
                  <UserPlus size={8} />
                </div>
                <span className='text-[8px] leading-none font-medium'>Parent</span>
                {/* Bottom connection dot */}
                <div className='absolute -bottom-1 left-1/2 w-2 h-2 bg-amber-600 rounded-full -translate-x-1/2 border border-white'></div>
              </button>
            </div>
          )}

          {/* Add Spouse - Right (Mini NodeCard with connection line) */}
          {shouldShowButton("spouse") && (
            <div className='absolute top-1/2 -right-14 -translate-y-1/2 z-10'>
              {/* Connection line from main node to spouse button */}
              <div className='absolute top-1/2 right-8 w-6 h-0.5 bg-gray-400 dark:bg-gray-500 -translate-y-1/2'></div>
              <button
                onClick={(e) => handleAddRelative(e, "spouse")}
                className='w-16 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex flex-col items-center justify-center text-white shadow-lg hover:from-pink-600 hover:to-rose-700 transition-all transform hover:scale-105 hover:shadow-xl border border-white/20 relative'
                title='Add Spouse'
                aria-label='Add spouse'>
                <div className='w-4 h-4 rounded-full bg-white/30 flex items-center justify-center mb-0.5'>
                  <Heart size={8} />
                </div>
                <span className='text-[8px] leading-none font-medium'>Spouse</span>
                {/* Left connection dot */}
                <div className='absolute -left-1 top-1/2 w-2 h-2 bg-pink-600 rounded-full -translate-y-1/2 border border-white'></div>
              </button>
            </div>
          )}

          {/* Add Child - Bottom (Mini NodeCard with connection line) */}
          {shouldShowButton("child") && (
            <div className='absolute -bottom-14 left-1/2 -translate-x-1/2 z-10'>
              {/* Connection line from main node to child button */}
              <div className='absolute bottom-8 left-1/2 w-0.5 h-6 bg-gray-400 dark:bg-gray-500 -translate-x-1/2'></div>
              <button
                onClick={(e) => handleAddRelative(e, "child")}
                className='w-16 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex flex-col items-center justify-center text-white shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 hover:shadow-xl border border-white/20 relative'
                title='Add Child'
                aria-label='Add child'>
                <div className='w-4 h-4 rounded-full bg-white/30 flex items-center justify-center mb-0.5'>
                  <Baby size={8} />
                </div>
                <span className='text-[8px] leading-none font-medium'>Child</span>
                {/* Top connection dot */}
                <div className='absolute -top-1 left-1/2 w-2 h-2 bg-green-600 rounded-full -translate-x-1/2 border border-white'></div>
              </button>
            </div>
          )}

          {/* Add Sibling - Left (Mini NodeCard with connection line) */}
          {shouldShowButton("sibling") && (
            <div className='absolute top-1/2 -left-14 -translate-y-1/2 z-10'>
              {/* Connection line from main node to sibling button */}
              <div className='absolute top-1/2 left-8 w-6 h-0.5 bg-gray-400 dark:bg-gray-500 -translate-y-1/2'></div>
              <button
                onClick={(e) => handleAddRelative(e, "sibling")}
                className='w-16 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex flex-col items-center justify-center text-white shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105 hover:shadow-xl border border-white/20 relative'
                title='Add Sibling'
                aria-label='Add sibling'>
                <div className='w-4 h-4 rounded-full bg-white/30 flex items-center justify-center mb-0.5'>
                  <Users2 size={8} />
                </div>
                <span className='text-[8px] leading-none font-medium'>Sibling</span>
                {/* Right connection dot */}
                <div className='absolute -right-1 top-1/2 w-2 h-2 bg-purple-600 rounded-full -translate-y-1/2 border border-white'></div>
              </button>
            </div>
          )}

          {/* More Actions Menu - Top Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickActions(!showQuickActions);
            }}
            className='absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-gray-700 transition-all transform hover:scale-110 z-10'
            title='More Actions'
            aria-label='More actions'>
            <MoreHorizontal size={10} />
          </button>
        </>
      )}

      {/* Enhanced Actions Menu with Node-shaped Options */}
      {showQuickActions && (
        <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[180px]'>
          <div className='p-3 space-y-2'>
            <div className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
              Add Relatives
            </div>
            {shouldShowButton("parent") && (
              <button
                onClick={(e) => handleAddRelative(e, "parent")}
                className='w-full text-left px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg flex items-center gap-3 transition-colors group'>
                <div className='w-6 h-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded flex items-center justify-center'>
                  <UserPlus size={10} className='text-white' />
                </div>
                <div>
                  <div className='font-medium'>Add Parent</div>
                  <div className='text-xs text-gray-500'>Father or Mother</div>
                </div>
              </button>
            )}
            {shouldShowButton("spouse") && (
              <button
                onClick={(e) => handleAddRelative(e, "spouse")}
                className='w-full text-left px-3 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg flex items-center gap-3 transition-colors group'>
                <div className='w-6 h-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded flex items-center justify-center'>
                  <Heart size={10} className='text-white' />
                </div>
                <div>
                  <div className='font-medium'>Add Spouse</div>
                  <div className='text-xs text-gray-500'>Husband or Wife</div>
                </div>
              </button>
            )}
            {shouldShowButton("child") && (
              <button
                onClick={(e) => handleAddRelative(e, "child")}
                className='w-full text-left px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg flex items-center gap-3 transition-colors group'>
                <div className='w-6 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center'>
                  <Baby size={10} className='text-white' />
                </div>
                <div>
                  <div className='font-medium'>Add Child</div>
                  <div className='text-xs text-gray-500'>Son or Daughter</div>
                </div>
              </button>
            )}
            {shouldShowButton("sibling") && (
              <button
                onClick={(e) => handleAddRelative(e, "sibling")}
                className='w-full text-left px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-3 transition-colors group'>
                <div className='w-6 h-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center'>
                  <Users2 size={10} className='text-white' />
                </div>
                <div>
                  <div className='font-medium'>Add Sibling</div>
                  <div className='text-xs text-gray-500'>Brother or Sister</div>
                </div>
              </button>
            )}
            <div className='border-t border-gray-200 dark:border-gray-600 my-2'></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Add edit functionality
              }}
              className='w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors text-gray-600 dark:text-gray-400'>
              <User size={14} />
              <div>
                <div className='font-medium'>Edit Person</div>
                <div className='text-xs text-gray-500'>Modify details</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
