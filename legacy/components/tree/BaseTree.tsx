/**
 * @file BaseTree component - a highly reusable and configurable D3-based tree visualization.
 * It can render hierarchical data directly or work with pre-calculated layouts.
 */
import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as d3 from "d3";
import { Card } from "@/components/ui/card";
import { useLinks } from "@/hooks/useLinks";
import { NodeCard } from "@/components/tree/NodeCard";
import {
  TreeNodeData,
  FamilyMember,
  RelationshipConnection,
} from "@/lib/types";
import { SmartSuggestionsEngine } from "@/lib/utils/SmartSuggestions";
import { InteractiveLink } from "@/components/tree-editor/InteractiveLink";
import { PlaceholderNode } from "@/components/tree-editor/PlaceholderNode";
import {
  getChildIds,
  getParentIds,
  getSiblingIds,
  getSpouseIds,
} from "@/lib/utils/relationshipHelpers";

/**
 * @interface BaseTreeSettings
 * @description Defines all layout, color, and display settings for the tree.
 */
export interface BaseTreeSettings {
  cardWidth: number;
  cardHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  margin: { top: number; right: number; bottom: number; left: number };
  maleColor: string;
  femaleColor: string;
  linkColor: string;
  orientation: "horizontal" | "vertical";
  direction:
    | "bottom-to-top"
    | "top-to-bottom"
    | "left-to-right"
    | "right-to-left";
  showLabels: {
    name: boolean;
    birthYear: boolean;
    deathYear: boolean;
    spouse: boolean;
    genderIcon: boolean;
  };
  lineShape: "straight" | "curved";
  lineLength: number;
  isFullScreen?: boolean;
}

/**
 * @interface BaseTreeProps
 * @description Defines the props for the BaseTree component, including data,
 * settings, event handlers, and display options.
 */
export interface BaseTreeProps {
  data: { [id: string]: FamilyMember };
  tree: TreeNodeData[];
  mainId: string;
  settings: BaseTreeSettings;
  relationships: RelationshipConnection[];
  isEditable?: boolean;
  exportable?: boolean;
  isDarkMode?: boolean;
  onNodeClick: (node: TreeNodeData) => void;
  onNodeDoubleClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
  onAddRelative: (
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
  onExport?: (format: "png" | "pdf") => void;
  onZoomIn?: (fn: () => void) => void;
  onZoomOut?: (fn: () => void) => void;
  onResetView?: (fn: () => void) => void;
  className?: string;
  style?: React.CSSProperties;
  svgId?: string;
  showMiniTreeOnClick?: boolean;
  selectedNodeId?: string;
  setFocusPerson?: (personId: string) => void;
}

/**
 * A unified, reusable component for rendering family trees. It handles the D3 logic
 * for layout and rendering, zoom/pan functionality, and exposes a rich set of props
 * for customization and interaction.
 */
export const BaseTree = forwardRef<any, BaseTreeProps>(
  (
    {
      data,
      tree,
      mainId,
      settings,
      relationships,
      isEditable = false,
      exportable = false,
      isDarkMode = false,
      onNodeClick,
      onNodeDoubleClick,
      onNodeHover,
      onAddRelative,
      onRelationshipDrop,
      onModifyRelationship,
      onExport,
      onZoomIn,
      onZoomOut,
      onResetView,
      className,
      style,
      svgId = "family-tree-svg",
      showMiniTreeOnClick = false,
      selectedNodeId,
      setFocusPerson,
    },
    ref
  ) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const htmlLayerRef = useRef<HTMLDivElement>(null);
    const links = useLinks(tree, data, settings, relationships);
    const [zoom, setZoom] = useState(1);
    const [miniTreeData, setMiniTreeData] = useState<any | null>(null);
    const [selectedLink, setSelectedLink] = useState<{
      id: string;
      type: "ancestry" | "progeny" | "spouse";
      person1: FamilyMember;
      person2: FamilyMember;
      position: { x: number; y: number };
    } | null>(null);

    // Store zoom functions to expose via ref
    const zoomFunctions = useRef<{
      zoomIn: () => void;
      zoomOut: () => void;
      resetView: () => void;
    }>({
      zoomIn: () => {},
      zoomOut: () => {},
      resetView: () => {},
    });

    /**
     * Utility function to detect mobile devices
     */
    const isMobileDevice = () => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth <= 768 ||
             /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Detect iOS Safari to handle foreignObject transform issues
    const isIOSSafari = () => {
      if (typeof navigator === 'undefined') return false;
      return /iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    /**
     * This effect sets up the D3 zoom and pan behavior on the SVG container.
     * It also exposes the zoom functions to the parent component.
     */
    useEffect(() => {
      if (!svgRef.current) return;

      // Wait for SVG to have concrete dimensions before initializing D3
      const checkDimensions = () => {
        const svgElement = svgRef.current;
        if (!svgElement) return false;

        const rect = svgElement.getBoundingClientRect();
        const hasValidDimensions = rect.width > 0 && rect.height > 0;

        // Also check for computed style dimensions
        const computedStyle = window.getComputedStyle(svgElement);
        const computedWidth = parseFloat(computedStyle.width);
        const computedHeight = parseFloat(computedStyle.height);

        return (
          hasValidDimensions &&
          !isNaN(computedWidth) &&
          !isNaN(computedHeight) &&
          computedWidth > 0 &&
          computedHeight > 0
        );
      };

      let timeoutId: ReturnType<typeof setTimeout>;

      const initialize = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = svg.select("g.tree-container");

        const zoomBehavior = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 3])
          .filter((event) => {
            // Prevent zoom/pan on drag events from nodes
            if (event.type === "mousedown" || event.type === "touchstart") {
              const target = event.target as Element;
              // Check if the event target is a draggable node or its child
              const isDraggableNode =
                target.closest('[draggable="true"]') !== null;
              const isNodeCard =
                target.closest(".cursor-grab, .cursor-grabbing") !== null;
              const isPlaceholderNode =
                target.closest('[data-placeholder="true"]') !== null;

              // Disable zoom/pan if it's a draggable element
              return !isDraggableNode && !isNodeCard && !isPlaceholderNode;
            }
            return true;
          })
          .on("zoom", (event) => {
            g.attr("transform", event.transform);
            setZoom(event.transform.k);
            if (isIOSSafari() && htmlLayerRef.current) {
              const transformStr = `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`;
              d3.select(htmlLayerRef.current)
                .style("transform", transformStr)
                .style("transformOrigin", "0 0");
            }
          });

        // Apply zoom behavior with error handling
        try {
          svg.call(zoomBehavior);
        } catch (error) {
          console.warn("Failed to initialize D3 zoom behavior:", error);
          return;
        }

        // Calculate tree bounds and center appropriately
        const centerTree = () => {
          if (!svgRef.current || tree.length === 0) return;

          // Get SVG dimensions with fallback and error handling
          let svgWidth: number;
          let svgHeight: number;

          try {
            const rect = svgRef.current.getBoundingClientRect();
            svgWidth = rect.width;
            svgHeight = rect.height;

            // Fallback to clientWidth/Height if getBoundingClientRect fails
            if (svgWidth === 0 || svgHeight === 0) {
              svgWidth = svgRef.current.clientWidth;
              svgHeight = svgRef.current.clientHeight;
            }

            // Final fallback to default dimensions
            if (svgWidth === 0 || svgHeight === 0) {
              svgWidth = 800;
              svgHeight = 600;
            }
          } catch (error) {
            console.warn("Failed to get SVG dimensions, using defaults:", error);
            svgWidth = 800;
            svgHeight = 600;
          }

          // Calculate tree bounds
          const nodeXPositions = tree
            .map((node) => node.x)
            .filter((x) => !isNaN(x));
          const nodeYPositions = tree
            .map((node) => node.y)
            .filter((y) => !isNaN(y));

          if (nodeXPositions.length === 0 || nodeYPositions.length === 0) {
            // Fallback to center if no valid positions
            const fallbackScale = isMobileDevice() ? 1.2 : 1; // Start more zoomed in on mobile
            const initialTransform = d3.zoomIdentity
              .translate(svgWidth / 2, svgHeight / 2)
              .scale(fallbackScale);
            svg.call(zoomBehavior.transform, initialTransform);
            return;
          }

          const minX = Math.min(...nodeXPositions);
          const maxX = Math.max(...nodeXPositions);
          const minY = Math.min(...nodeYPositions);
          const maxY = Math.max(...nodeYPositions);

          const treeWidth = maxX - minX + settings.cardWidth;
          const treeHeight = maxY - minY + settings.cardHeight;

          // Calculate center position
          const treeCenterX = (minX + maxX) / 2;
          const treeCenterY = (minY + maxY) / 2;

          // Calculate scale to fit tree in viewport with padding
          const padding = 100;
          const scaleX = (svgWidth - padding * 2) / treeWidth;
          const scaleY = (svgHeight - padding * 2) / treeHeight;

          let scale: number;
          if (isMobileDevice()) {
            // On mobile, start with a more zoomed-in view
            const mobileScale = Math.min(scaleX, scaleY, 1.5); // Allow scaling up to 1.5x on mobile
            scale = Math.max(mobileScale, 0.8); // Ensure minimum 0.8x zoom for readability
          } else {
            scale = Math.min(scaleX, scaleY, 1); // Don't scale up on desktop, only down
          }

          // Calculate translation to center the scaled tree
          const translateX = svgWidth / 2 - treeCenterX * scale;
          const translateY = svgHeight / 2 - treeCenterY * scale;

          const transform = d3.zoomIdentity
            .translate(translateX, translateY)
            .scale(scale);

          svg.transition().duration(750).call(zoomBehavior.transform, transform);
        };

        // Center on initial render and when tree changes
        centerTree();

        // Store zoom functions for ref exposure
        zoomFunctions.current = {
          zoomIn: () => svg.transition().call(zoomBehavior.scaleBy, 1.2),
          zoomOut: () => svg.transition().call(zoomBehavior.scaleBy, 1 / 1.2),
          resetView: () => centerTree(),
        };

        // Optional: expose handlers (backward compatibility)
        if (onZoomIn) onZoomIn(zoomFunctions.current.zoomIn);
        if (onZoomOut) onZoomOut(zoomFunctions.current.zoomOut);
        if (onResetView) onResetView(zoomFunctions.current.resetView);
      };

      const waitForDimensions = () => {
        if (checkDimensions()) {
          initialize();
        } else {
          timeoutId = setTimeout(waitForDimensions, 100);
        }
      };

      waitForDimensions();

      return () => clearTimeout(timeoutId);
    }, [
      onZoomIn,
      onZoomOut,
      onResetView,
      settings.cardWidth,
      settings.cardHeight,
    ]);

    // Expose zoom methods via ref
    useImperativeHandle(ref, () => ({
      onZoomIn: zoomFunctions.current.zoomIn,
      onZoomOut: zoomFunctions.current.zoomOut,
      onResetView: zoomFunctions.current.resetView,
    }));

    // Helper functions to get the correct X and Y coordinates for a node,
    // supporting both pre-calculated and D3-calculated layouts.
    const getNodeX = (node: any) => node.x;
    const getNodeY = (node: any) => node.y;

    // Determines the node's border color based on gender.
    const getNodeColor = (gender: string) =>
      gender === "male" ? settings.maleColor : settings.femaleColor;

    // A utility to calculate a person's age.
    const getAge = (birth: number, death?: number) => {
      const end = death || new Date().getFullYear();
      return end - birth;
    };

    /**
     * Handles a click event on a node.
     * It can either show a mini-tree popup or just call the `onNodeClick` handler,
     * depending on the `showMiniTreeOnClick` prop.
     */
    const handleNodeClick = (node: any) => {
      if (showMiniTreeOnClick) {
        // Use relationship helpers to get family members
        const parentIds = getParentIds(node.id, relationships);
        const siblingIds = getSiblingIds(node.id, relationships);
        const childIds = getChildIds(node.id, relationships);
        
        setMiniTreeData({
          self: node,
          parents: parentIds.length > 0 ? parentIds.map(id => ({ data: data[id] })) : null,
          siblings: siblingIds.length > 0 ? siblingIds.map(id => ({ data: data[id] })) : null,
          children: childIds.length > 0 ? childIds.map(id => ({ data: data[id] })) : [],
        });
      }
      if (typeof node.id === "string" && setFocusPerson) {
        setFocusPerson(node.id);
      }
      onNodeClick?.(node.data);
    };

    /**
     * Handles a double-click event, passing it up to the parent.
     */
    const handleNodeDoubleClick = (node: any) => {
      onNodeDoubleClick?.(node.data);
    };

    /**
     * Closes the mini-tree popup.
     */
    const closeMiniTree = () => {
      setMiniTreeData(null);
    };

    /**
     * Handles clicking on a relationship link
     */
    const handleLinkClick = (event: React.MouseEvent, link: any) => {
      event.stopPropagation();

      // Get click position relative to the SVG
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const clickX = event.clientX;
      const clickY = event.clientY;

      // Use personIds from link if available, otherwise fallback to parsing link.id
      let person1: FamilyMember | undefined;
      let person2: FamilyMember | undefined;

      if (link.personIds && link.personIds.length >= 2) {
        person1 = data[link.personIds[0]];
        person2 = data[link.personIds[1]];
      } else {
        // Fallback to parsing link ID
        const linkParts = link.id.split("-");
        if (linkParts.length >= 3) {
          const person1Id = linkParts[1]; // Skip prefix like "spouse", "stem", etc.
          const person2Id = linkParts[2];
          person1 = data[person1Id];
          person2 = data[person2Id];
        }
      }

      if (person1 && person2) {
        setSelectedLink({
          id: link.id,
          type: link.type,
          person1,
          person2,
          position: { x: clickX, y: clickY },
        });
      }
    };

    /**
     * Handles relationship modification from link interaction
     */
    const handleLinkRelationshipModify = (
      personId1: string,
      personId2: string,
      action: "connect" | "disconnect" | "modify",
      relationshipType: "parent" | "spouse" | "child" | "sibling"
    ) => {
      if (onModifyRelationship) {
        onModifyRelationship(personId1, personId2, action, relationshipType);
      } else if (onRelationshipDrop && action === "connect") {
        // Fallback to relationship drop handler for connect operations
        onRelationshipDrop(personId1, personId2, relationshipType);
      }
    };

    return (
      <div className={className} style={style}>
        <Card
          className={`relative overflow-hidden ${
            isDarkMode ? "bg-gray-900" : "bg-white"
          }`}
          style={{
            height: settings.isFullScreen ? "100vh" : "800px",
            touchAction: "none",
          }}>
          <svg
            id={svgId}
            ref={svgRef}
            style={{
              width: "100%",
              height: "100%",
              background: isDarkMode ? "#18181b" : "#f9fafb",
              overflow: "hidden", // Prevent overflow
              display: "block",
              touchAction: "none",
            }}>
            <g className="tree-container">
              {/* Render links */}
              {links
                .filter((link) => link.relationshipType !== "sibling")
                .map((link, i) => {
                  // Calculate midpoint of the link for button placement
                  let midPoint = { x: 0, y: 0 };

                  // Only calculate midpoint on client side to avoid SSR issues
                  if (typeof window !== "undefined") {
                    try {
                      const pathEl = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "path"
                      );
                      pathEl.setAttribute("d", link.d);
                      const pathLength = pathEl.getTotalLength
                        ? pathEl.getTotalLength()
                        : 0;
                      if (pathLength > 0 && pathEl.getPointAtLength) {
                        midPoint = pathEl.getPointAtLength(pathLength / 2);
                      }
                    } catch (error) {
                      console.warn("Error calculating path midpoint:", error);
                      // Fallback: estimate midpoint from link data
                      midPoint = { x: 0, y: 0 };
                    }
                  }

                  return (
                    <g key={link.id} className='link-group'>
                      {/* Main link path */}
                      <path
                        d={link.d}
                        fill='none'
                        stroke={
                          link.relationshipType === "spouse"
                            ? "#EC4899"
                            : link.relationshipType === "sibling"
                            ? "#8B5CF6"
                            : settings.linkColor
                        }
                        strokeWidth={
                          link.relationshipType === "spouse"
                            ? 2
                            : link.relationshipType === "sibling"
                            ? 1.5
                            : 2
                        }
                        className='transition-all duration-200'
                      />
                      {/* Interactive overlay path (wider, invisible) */}
                      <path
                        d={link.d}
                        fill='none'
                        stroke='transparent'
                        strokeWidth={12}
                        className='cursor-pointer hover:stroke-blue-400 hover:stroke-opacity-30 transition-all duration-200'
                        onClick={(e) => handleLinkClick(e, link)}
                        style={{ pointerEvents: isEditable ? "auto" : "none" }}
                      />
                      {/* Visual hover indicator */}
                      <path
                        d={link.d}
                        fill='none'
                        stroke={
                          link.relationshipType === "spouse"
                            ? "#EC4899"
                            : link.relationshipType === "sibling"
                            ? "#8B5CF6"
                            : settings.linkColor
                        }
                        strokeWidth={
                          link.relationshipType === "spouse"
                            ? 3
                            : link.relationshipType === "sibling"
                            ? 2.5
                            : 3
                        }
                        className='opacity-0 hover:opacity-50 transition-opacity duration-200 pointer-events-none'
                        strokeDasharray='4,4'
                      />

                      {/* Link Control Buttons - only show in edit mode */}
                      {isEditable && (
                        <g className='link-controls opacity-0 hover:opacity-100 transition-opacity duration-200'>
                          {/* Remove relationship button (X) */}
                          <circle
                            cx={midPoint.x - 12}
                            cy={midPoint.y}
                            r='8'
                            fill='rgba(239, 68, 68, 0.9)'
                            stroke='white'
                            strokeWidth='1'
                            className='cursor-pointer hover:fill-red-600 transition-colors'
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                onModifyRelationship &&
                                link.personIds &&
                                link.personIds.length >= 2
                              ) {
                                onModifyRelationship(
                                  link.personIds[0],
                                  link.personIds[1],
                                  "disconnect",
                                  link.relationshipType || "parent"
                                );
                              }
                            }}
                          />
                          <text
                            x={midPoint.x - 12}
                            y={midPoint.y + 3}
                            textAnchor='middle'
                            fontSize='10'
                            fill='white'
                            className='pointer-events-none select-none'
                            fontWeight='bold'>
                            ×
                          </text>

                          {/* Add sibling/additional relationship button (+) - only for parent-child links */}
                          {link.relationshipType === "parent" && (
                            <>
                              <circle
                                cx={midPoint.x + 12}
                                cy={midPoint.y}
                                r='8'
                                fill='rgba(34, 197, 94, 0.9)'
                                stroke='white'
                                strokeWidth='1'
                                className='cursor-pointer hover:fill-green-600 transition-colors'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    link.personIds &&
                                    link.personIds.length >= 2
                                  ) {
                                    // Add sibling to the child
                                    onAddRelative(link.personIds[1], "sibling");
                                  }
                                }}
                              />
                              <text
                                x={midPoint.x + 12}
                                y={midPoint.y + 3}
                                textAnchor='middle'
                                fontSize='10'
                                fill='white'
                                className='pointer-events-none select-none'
                                fontWeight='bold'>
                                +
                              </text>
                            </>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}

              {/* Render nodes with foreignObject when supported */}
              {!isIOSSafari() &&
                tree.map((node) => {
                  // Use consistent card dimensions that match the settings
                  const actualCardWidth = settings.cardWidth;
                  const actualCardHeight = settings.cardHeight;
                  const expandedWidth = actualCardWidth + 40; // Extra space for buttons
                  const expandedHeight = actualCardHeight + 40;

                  // Ensure node has valid coordinates
                  const nodeX =
                    typeof node.x === "number" && !isNaN(node.x) ? node.x : 0;
                  const nodeY =
                    typeof node.y === "number" && !isNaN(node.y) ? node.y : 0;

                  return (
                    <foreignObject
                      key={node.id}
                      x={nodeX - expandedWidth / 2}
                      y={nodeY - expandedHeight / 2}
                      width={expandedWidth}
                      height={expandedHeight}
                      style={{ overflow: "visible" }}>
                      <div
                        style={{
                          width: expandedWidth,
                          height: expandedHeight,
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                        <NodeCard
                          node={node}
                          isDarkMode={isDarkMode}
                          isSelected={selectedNodeId === node.id}
                          onNodeClick={onNodeClick}
                          onAddRelative={onAddRelative}
                          onRelationshipDrop={onRelationshipDrop}
                          showSuggestionIndicator={
                            data[node.id]
                              ? SmartSuggestionsEngine.generateSuggestions(
                                  data[node.id],
                                  data,
                                  relationships
                                ).length > 0
                              : false
                          }
                          maleColor={settings.maleColor}
                          femaleColor={settings.femaleColor}
                          showLabels={settings.showLabels}
                          allFamilyData={data}
                          style={{
                            width: actualCardWidth,
                            height: actualCardHeight,
                            position: "relative",
                          }}
                        />
                      </div>
                    </foreignObject>
                  );
                })}

              {/* Render placeholder nodes for adding relatives - only for selected node */}
              {isEditable &&
                selectedNodeId &&
                tree
                  .filter((node) => node.id === selectedNodeId)
                  .map((node) => {
                    const nodeX =
                      typeof node.x === "number" && !isNaN(node.x) ? node.x : 0;
                    const nodeY =
                      typeof node.y === "number" && !isNaN(node.y) ? node.y : 0;
                    const placeholders: JSX.Element[] = [];

                    // Get the actual family member data (not just tree node data)
                    const familyMember = data[node.id];
                    if (!familyMember) return [];
                    // Calculate placeholder positions based on node position
                    const spacing = settings.cardWidth * 1.5;
                    const verticalSpacing = settings.cardHeight * 1.2;

                    // Use helpers with relationships array
                    const parentIds = getParentIds(node.id, relationships);
                    const spouseIds = getSpouseIds(node.id, relationships);
                    // Parent placeholder (above) - only show if person has fewer than 2 parents
                    const hasMaxParents = parentIds.length >= 2;
                    if (!hasMaxParents) {
                      placeholders.push(
                        <PlaceholderNode
                          key={`${node.id}-parent`}
                          type='parent'
                          isDarkMode={isDarkMode}
                          onClick={() => onAddRelative(node.id, "parent")}
                          x={nodeX}
                          y={nodeY - verticalSpacing}
                          targetPersonName={familyMember.name}
                        />
                      );
                    }
                    // Spouse placeholder (LEFT side) - show if no spouse exists
                    const hasSpouse = spouseIds.length > 0;
                    if (!hasSpouse) {
                      placeholders.push(
                        <PlaceholderNode
                          key={`${node.id}-spouse`}
                          type='spouse'
                          isDarkMode={isDarkMode}
                          onClick={() => onAddRelative(node.id, "spouse")}
                          x={nodeX - spacing}
                          y={nodeY}
                          targetPersonName={familyMember.name}
                        />
                      );
                    }
                    // Child placeholder (below or at end of children row)
                    // Find children nodes - using both tree hierarchy and relationship data
                    const childrenFromRelationships = getChildIds(
                      node.id,
                      relationships
                    );
                    const childrenNodes = tree.filter((n) =>
                      childrenFromRelationships.includes(n.id)
                    );

                    if (childrenNodes.length > 0) {
                      // Sort children by x position to find the rightmost one
                      const sortedChildren = [...childrenNodes].sort(
                        (a, b) => a.x - b.x
                      );
                      const rightmostChild =
                        sortedChildren[sortedChildren.length - 1];

                      // Calculate position next to the rightmost child
                      const childPlaceholderX = rightmostChild.x + spacing;
                      const childPlaceholderY = rightmostChild.y;

                      // Ensure we don't overlap with other nodes at the same level
                      const sameYNodes = tree.filter(
                        (n) =>
                          Math.abs(n.y - childPlaceholderY) <
                            verticalSpacing * 0.3 && n.id !== node.id
                      );

                      let finalChildX = childPlaceholderX;

                      // Check for potential conflicts and adjust position if necessary
                      let hasConflict = true;
                      let attempts = 0;
                      while (hasConflict && attempts < 10) {
                        hasConflict = sameYNodes.some(
                          (n) => Math.abs(n.x - finalChildX) < spacing * 0.8
                        );
                        if (hasConflict) {
                          finalChildX += spacing * 0.5;
                        }
                        attempts++;
                      }

                      placeholders.push(
                        <PlaceholderNode
                          key={`${node.id}-child`}
                          type='child'
                          isDarkMode={isDarkMode}
                          onClick={() => onAddRelative(node.id, "child")}
                          x={finalChildX}
                          y={childPlaceholderY}
                          targetPersonName={familyMember.name}
                        />
                      );
                    } else {
                      // No children exist, place directly below the parent
                      placeholders.push(
                        <PlaceholderNode
                          key={`${node.id}-child`}
                          type='child'
                          isDarkMode={isDarkMode}
                          onClick={() => onAddRelative(node.id, "child")}
                          x={nodeX}
                          y={nodeY + verticalSpacing}
                          targetPersonName={familyMember.name}
                        />
                      );
                    }
                    // Sibling placeholder (opposite side of spouse)
                    const hasParentsForSiblings = parentIds.length > 0;
                    if (hasParentsForSiblings) {
                      // Default: right side
                      let siblingX = nodeX + spacing;

                      // If spouse exists, place sibling on opposite side
                      if (hasSpouse) {
                        // Find spouse node (if present in tree)
                        const spouseNode = tree.find((n) =>
                          spouseIds.includes(n.id)
                        );
                        if (spouseNode) {
                          const spouseDistance = Math.abs(spouseNode.x - nodeX);
                          // Only consider it positioned if there's significant distance
                          if (spouseDistance > spacing * 0.3) {
                            if (spouseNode.x > nodeX) {
                              // Spouse is on the right, place sibling on the left
                              siblingX = nodeX - spacing;
                            } else {
                              // Spouse is on the left, place sibling on the right
                              siblingX = nodeX + spacing;
                            }
                          } else {
                            // Spouse is very close or at same position, default to right
                            siblingX = nodeX + spacing;
                          }
                        }
                      }

                      // Check for existing siblings to avoid overlaps
                      const existingSiblings = tree.filter((n) => {
                        const siblingIds = getSiblingIds(
                          node.id,
                          relationships
                        );
                        return siblingIds.includes(n.id);
                      });

                      // If there are existing siblings, find a good position
                      if (existingSiblings.length > 0) {
                        // Check if our calculated position conflicts with existing siblings
                        const hasConflict = existingSiblings.some(
                          (sibling) =>
                            Math.abs(sibling.x - siblingX) < spacing * 0.8
                        );

                        if (hasConflict) {
                          // Find the rightmost sibling and place after it
                          const rightmostSibling = existingSiblings.reduce(
                            (max, sibling) =>
                              sibling.x > max.x ? sibling : max
                          );
                          siblingX = rightmostSibling.x + spacing;
                        }
                      }

                      placeholders.push(
                        <PlaceholderNode
                          key={`${node.id}-sibling`}
                          type='sibling'
                          isDarkMode={isDarkMode}
                          onClick={() => onAddRelative(node.id, "sibling")}
                          x={siblingX}
                          y={nodeY}
                          targetPersonName={familyMember.name}
                        />
                      );
                    }
                    return placeholders;
                  })
                  .flat()}
            </g>
          </svg>
          {isIOSSafari() && (
            <div
              ref={htmlLayerRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "translate(0px, 0px) scale(1)",
                transformOrigin: "0 0",
                pointerEvents: "none",
                touchAction: "none",
              }}
            >
              {tree.map((node) => {
                const actualCardWidth = settings.cardWidth;
                const actualCardHeight = settings.cardHeight;
                const expandedWidth = actualCardWidth + 40;
                const expandedHeight = actualCardHeight + 40;
                const nodeX =
                  typeof node.x === "number" && !isNaN(node.x) ? node.x : 0;
                const nodeY =
                  typeof node.y === "number" && !isNaN(node.y) ? node.y : 0;

                return (
                  <div
                    key={node.id}
                    style={{
                      position: "absolute",
                      left: nodeX - expandedWidth / 2,
                      top: nodeY - expandedHeight / 2,
                      width: expandedWidth,
                      height: expandedHeight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "auto",
                    }}
                  >
                    <NodeCard
                      node={node}
                      isDarkMode={isDarkMode}
                      isSelected={selectedNodeId === node.id}
                      onNodeClick={onNodeClick}
                      onAddRelative={onAddRelative}
                      onRelationshipDrop={onRelationshipDrop}
                      showSuggestionIndicator={
                        data[node.id]
                          ? SmartSuggestionsEngine.generateSuggestions(
                              data[node.id],
                              data,
                              relationships
                            ).length > 0
                          : false
                      }
                      maleColor={settings.maleColor}
                      femaleColor={settings.femaleColor}
                      showLabels={settings.showLabels}
                      allFamilyData={data}
                      style={{
                        width: actualCardWidth,
                        height: actualCardHeight,
                        position: "relative",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {/* Mini tree overlay */}
          {showMiniTreeOnClick && miniTreeData && (
            <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
              <Card
                className={`w-[90%] max-w-4xl p-6 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}>
                <div className='flex items-center justify-between mb-6'>
                  <h2
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }`}>
                    شجرة العائلة المصغرة
                  </h2>
                  <button
                    onClick={closeMiniTree}
                    className='hover:bg-amber-100 rounded p-2'>
                    ✕
                  </button>
                </div>
                <div className='grid grid-cols-2 gap-6'>
                  {/* Self */}
                  <div className='space-y-4'>
                    <h3
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-amber-300" : "text-amber-800"
                      }`}>
                      الشخص المحدد
                    </h3>
                    {miniTreeData.self && (
                      <div
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-amber-50"
                        }`}>
                        <p className='font-semibold'>
                          {miniTreeData.self.data.name}
                        </p>
                        <p className='text-sm'>
                          {miniTreeData.self.data.birth_year}
                          {miniTreeData.self.data.death_year
                            ? ` - ${miniTreeData.self.data.death_year}`
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Parents */}
                  {miniTreeData.parents && (
                    <div className='space-y-4'>
                      <h3
                        className={`text-lg font-semibold ${
                          isDarkMode ? "text-amber-300" : "text-amber-800"
                        }`}>
                        الوالدين
                      </h3>
                      {miniTreeData.parents.map((parent: any) => (
                        <div
                          key={parent.data.name}
                          className={`p-4 rounded-lg ${
                            isDarkMode ? "bg-gray-700" : "bg-amber-50"
                          }`}>
                          <p className='font-semibold'>{parent.data.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Children */}
                  {miniTreeData.children &&
                    miniTreeData.children.length > 0 && (
                      <div className='space-y-4'>
                        <h3
                          className={`text-lg font-semibold ${
                            isDarkMode ? "text-amber-300" : "text-amber-800"
                          }`}>
                          الأبناء
                        </h3>
                        {miniTreeData.children.map((child: any) => (
                          <div
                            key={child.data.name}
                            className={`p-4 rounded-lg ${
                              isDarkMode ? "bg-gray-700" : "bg-amber-50"
                            }`}>
                            <p className='font-semibold'>{child.data.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </Card>
            </div>
          )}

          {/* Interactive Link Management */}
          {selectedLink && (
            <InteractiveLink
              linkData={selectedLink}
              position={selectedLink.position}
              relationships={relationships}
              isDarkMode={isDarkMode}
              onModifyRelationship={handleLinkRelationshipModify}
              onClose={() => setSelectedLink(null)}
            />
          )}
        </Card>
      </div>
    );
  }
);
