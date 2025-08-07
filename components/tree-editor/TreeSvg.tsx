import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useTreeStore } from "../../hooks/useTreeStore";
import { BaseTree, BaseTreeSettings } from "@/components/tree/BaseTree";
import { TreeNodeData } from "../../lib/types";

// You may want to define or import your default settings
const defaultSettings: BaseTreeSettings = {
  cardWidth: 180,
  cardHeight: 120,
  horizontalSpacing: 2.2,
  verticalSpacing: 1.8,
  margin: { top: 80, right: 80, bottom: 80, left: 80 },
  maleColor: "hsl(var(--primary))",
  femaleColor: "hsl(var(--destructive))",
  linkColor: "hsl(var(--muted-foreground))",
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
  onAddRelative?: (
    nodeId: string,
    type: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  onRelationshipDrop?: (
    sourceId: string,
    targetId: string,
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  onModifyRelationship?: (
    personId1: string,
    personId2: string,
    action: "connect" | "disconnect" | "modify",
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  className?: string;
  selectedNodeId?: string;
  [key: string]: any;
}

export const TreeSvg = forwardRef<any, TreeSvgProps>(
  (
    {
      isDarkMode = false,
      onNodeClick = () => {},
      onAddRelative = () => {},
      onRelationshipDrop,
      onModifyRelationship,
      className = "",
      selectedNodeId,
      ...rest
    },
    ref
  ) => {
    const {
      tree,
      data,
      mainId,
      cardWidth,
      cardHeight,
      nodeSeparation,
      levelSeparation,
      horizontalSpacing,
      verticalSpacing,
      maleColor,
      femaleColor,
      linkColor,
      lineShape,
      showLabels,
      showSpouses,
      relationships,
      focusPersonId,
      setFocusPerson,
    } = useTreeStore();
    const baseTreeRef = useRef<any>(null);

    // Create dynamic settings based on store values
    const dynamicSettings: BaseTreeSettings = {
      ...defaultSettings,
      cardWidth,
      cardHeight,
      horizontalSpacing,
      verticalSpacing,
      maleColor,
      femaleColor,
      linkColor,
      lineShape,
      showLabels,
      // Optionally include showSpouses if BaseTreeSettings supports it
      // showSpouses,
    };

    // Expose zoom methods to parent component
    useImperativeHandle(ref, () => ({
      onZoomIn: () => baseTreeRef.current?.onZoomIn?.(),
      onZoomOut: () => baseTreeRef.current?.onZoomOut?.(),
      onResetView: () => baseTreeRef.current?.onResetView?.(),
    }));

    return (
      <div className={`w-full h-full ${className}`}>
        <BaseTree
          ref={baseTreeRef}
          data={data}
          tree={tree}
          mainId={mainId}
          settings={dynamicSettings}
          isEditable={true}
          isDarkMode={isDarkMode}
          onNodeClick={onNodeClick}
          onAddRelative={onAddRelative}
          onRelationshipDrop={onRelationshipDrop}
          onModifyRelationship={onModifyRelationship}
          selectedNodeId={focusPersonId || mainId}
          setFocusPerson={setFocusPerson}
          relationships={relationships}
          className='w-full h-full'
          {...rest}
        />
      </div>
    );
  }
);
