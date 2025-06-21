import React from "react";
import { TreeNodeData } from "../../lib/types";
import { User, Users, Plus } from "lucide-react";

interface NodeCardProps {
  node: TreeNodeData;
  isDarkMode: boolean;
  isSelected: boolean;
  onNodeClick: (node: TreeNodeData) => void;
  onAddRelative: (nodeId: string, type: "parent" | "spouse" | "child") => void;
  style: React.CSSProperties;
  maleColor: string;
  femaleColor: string;
}

export function NodeCard({
  node,
  isDarkMode,
  isSelected,
  onNodeClick,
  onAddRelative,
  style,
  maleColor,
  femaleColor,
}: NodeCardProps) {
  const genderColor = node.gender === "male" ? maleColor : femaleColor;
  const textColor = isDarkMode ? "text-gray-100" : "text-white";

  const cardStyle: React.CSSProperties = {
    ...style,
    backgroundColor: genderColor,
    borderColor: isSelected ? "hsl(var(--yellow-400))" : genderColor,
    boxShadow: isSelected
      ? `0 0 12px ${genderColor}`
      : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  };

  if (!node || !node.id) {
    return null; // Don't render if node data is incomplete
  }

  return (
    <div
      style={cardStyle}
      className='absolute cursor-pointer group rounded-lg transition-all duration-300 border-2'
      onClick={() => onNodeClick(node)}>
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

      {/* Add Relative Buttons (only show on hover of selected card) */}
      {isSelected && (
        <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity'>
          {/* Add Parent */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddRelative(node.id, "parent");
            }}
            className='absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-transform transform hover:scale-110'
            title='Add Parent'>
            <Plus size={16} />
          </button>
          {/* Add Spouse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddRelative(node.id, "spouse");
            }}
            className='absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-110'
            title='Add Spouse'>
            <Plus size={16} />
          </button>
          {/* Add Child */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddRelative(node.id, "child");
            }}
            className='absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-yellow-600 transition-transform transform hover:scale-110'
            title='Add Child'>
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
