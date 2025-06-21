import React from "react";
import { TreeNodeData } from "../../lib/types";
import { getLinkColor, getLinkStrokeWidth } from "../../hooks/useLinks";

interface LinkProps {
  link: {
    id: string;
    d: string;
    curve: string;
    depth: number;
    type: "ancestry" | "progeny" | "spouse";
  };
  isDarkMode?: boolean;
  isAnimated?: boolean;
  opacity?: number;
}

export function Link({
  link,
  isDarkMode = false,
  isAnimated = true,
  opacity = 1,
}: LinkProps) {
  const color = getLinkColor(link.type, isDarkMode);
  const strokeWidth = getLinkStrokeWidth(link.type);

  return (
    <path
      id={link.id}
      d={link.d}
      fill='none'
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeLinecap='round'
      strokeLinejoin='round'
      style={{
        transition: isAnimated ? "all 0.3s ease-in-out" : "none",
        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.2))",
      }}
      className={`link link-${link.type}`}
    />
  );
}
