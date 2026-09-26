import React, { useState } from "react";
import { Plus, User, Heart, Baby, Users2 } from "lucide-react";

interface PlaceholderNodeProps {
  type: "parent" | "spouse" | "child" | "sibling";
  isDarkMode?: boolean;
  onClick: () => void;
  x: number;
  y: number;
  targetPersonName?: string;
}

const getPlaceholderConfig = (type: "parent" | "spouse" | "child" | "sibling", isDarkMode: boolean) => {
  const configs = {
    parent: {
      label: "إضافة والد/والدة",
      icon: User,
      background: isDarkMode ? "#1e3a8a20" : "#dbeafe",
      border: isDarkMode ? "#3b82f6" : "#93c5fd",
      iconColor: isDarkMode ? "#93c5fd" : "#1d4ed8",
      textColor: isDarkMode ? "#93c5fd" : "#1e40af",
      hoverBackground: isDarkMode ? "#1e3a8a40" : "#bfdbfe",
    },
    spouse: {
      label: "إضافة زوج/زوجة",
      icon: Heart,
      background: isDarkMode ? "#831843" : "#fce7f3",
      border: isDarkMode ? "#ec4899" : "#f9a8d4",
      iconColor: isDarkMode ? "#f9a8d4" : "#be185d",
      textColor: isDarkMode ? "#f9a8d4" : "#be185d",
      hoverBackground: isDarkMode ? "#be185d40" : "#fbcfe8",
    },
    child: {
      label: "إضافة طفل",
      icon: Baby,
      background: isDarkMode ? "#14532d20" : "#dcfce7",
      border: isDarkMode ? "#22c55e" : "#86efac",
      iconColor: isDarkMode ? "#86efac" : "#15803d",
      textColor: isDarkMode ? "#86efac" : "#166534",
      hoverBackground: isDarkMode ? "#14532d40" : "#bbf7d0",
    },
    sibling: {
      label: "إضافة شقيق/شقيقة",
      icon: Users2,
      background: isDarkMode ? "#581c8720" : "#f3e8ff",
      border: isDarkMode ? "#a855f7" : "#c084fc",
      iconColor: isDarkMode ? "#c084fc" : "#7c3aed",
      textColor: isDarkMode ? "#c084fc" : "#7c2d12",
      hoverBackground: isDarkMode ? "#581c8740" : "#e9d5ff",
    }
  };
  
  return configs[type];
};

export const PlaceholderNode: React.FC<PlaceholderNodeProps> = ({
  type,
  isDarkMode = false,
  onClick,
  x,
  y,
  targetPersonName,
}) => {
  const config = getPlaceholderConfig(type, isDarkMode);
  const IconComponent = config.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g 
      transform={`translate(${x - 75}, ${y - 50})`} 
      data-placeholder="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Drop shadow */}
      <defs>
        <filter id={`shadow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
        </filter>
      </defs>
      
      {/* Main placeholder card with modern design */}
      <rect
        width={150}
        height={100}
        rx={12}
        fill={isHovered ? config.hoverBackground : config.background}
        stroke={config.border}
        strokeWidth="2"
        strokeDasharray="8,4"
        onClick={onClick}
        filter={`url(#shadow-${type})`}
        style={{
          transition: 'all 0.2s ease-in-out',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)'
        }}
      />
      
      {/* Central plus icon with background */}
      <circle
        cx={75}
        cy={35}
        r={18}
        fill={config.iconColor}
        opacity="0.1"
        onClick={onClick}
      />
      <circle
        cx={75}
        cy={35}
        r={12}
        fill="white"
        stroke={config.iconColor}
        strokeWidth="2"
        onClick={onClick}
      />
      
      {/* Plus icon */}
      <g onClick={onClick} style={{ pointerEvents: 'none' }}>
        <line
          x1={75 - 6}
          y1={35}
          x2={75 + 6}
          y2={35}
          stroke={config.iconColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1={75}
          y1={35 - 6}
          x2={75}
          y2={35 + 6}
          stroke={config.iconColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      
      {/* Relationship type icon */}
      <g transform={`translate(20, 15)`} style={{ pointerEvents: 'none' }}>
        <IconComponent
          width={20}
          height={20}
          stroke={config.iconColor}
          fill="none"
          strokeWidth="1.5"
        />
      </g>
      
      {/* Arabic label with better typography */}
      <text
        x={75}
        y={65}
        textAnchor="middle"
        fill={config.textColor}
        fontSize="13"
        fontWeight="600"
        fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {config.label}
      </text>
      
      {/* Relationship context */}
      {targetPersonName && (
        <text
          x={75}
          y={82}
          textAnchor="middle"
          fill={config.textColor}
          fontSize="10"
          opacity="0.7"
          fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          لـ {targetPersonName}
        </text>
      )}
      
      {/* Invisible click area for better UX */}
      <rect
        width={150}
        height={100}
        rx={12}
        fill="transparent"
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
};

export default PlaceholderNode;