import React from "react";
import { useTreeStore } from "../../hooks/useTreeStore";
import { BaseTree, BaseTreeSettings } from "@/components/tree/BaseTree";
import { TreeNodeData } from "../../lib/types";

// You may want to define or import your default settings
const defaultSettings: BaseTreeSettings = {
  cardWidth: 140,
  cardHeight: 80,
  horizontalSpacing: 2.0,
  verticalSpacing: 2.5,
  margin: { top: 60, right: 60, bottom: 60, left: 60 },
  maleColor: "#1E40AF",
  femaleColor: "#BE185D",
  linkColor: "#3B82F6",
  orientation: "vertical",
  direction: "bottom-to-top",
  showLabels: {
    name: true,
    birthYear: true,
    deathYear: true,
    spouse: true,
    genderIcon: true,
  },
  lineShape: "curved",
  lineLength: 1.0,
  isFullScreen: false,
};

export interface TreeSvgProps {
  isDarkMode?: boolean;
  onNodeClick?: (node: TreeNodeData) => void;
  onAddRelative?: (nodeId: string, type: "parent" | "spouse" | "child") => void;
  className?: string;
  selectedNodeId?: string;
  [key: string]: any;
}

export function TreeSvg({
  isDarkMode = false,
  onNodeClick = () => {},
  onAddRelative = () => {},
  className = "",
  selectedNodeId,
  ...rest
}: TreeSvgProps) {
  const { tree, data, mainId } = useTreeStore();
  // Compose flat data for BaseTree
  const flatData = { data, tree, mainId };

  return (
    <BaseTree
      data={data}
      tree={tree}
      mainId={mainId}
      settings={defaultSettings}
      isEditable={true}
      isDarkMode={isDarkMode}
      onNodeClick={onNodeClick}
      onAddRelative={onAddRelative}
      className={className}
      selectedNodeId={selectedNodeId}
      {...rest}
    />
  );
}
