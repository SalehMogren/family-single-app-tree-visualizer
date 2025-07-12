/**
 * @file BaseTree component - a highly reusable and configurable D3-based tree visualization.
 * It can render hierarchical data directly or work with pre-calculated layouts.
 */
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import { Card } from "@/components/ui/card";
import { useLinks } from "@/hooks/useLinks";
import { NodeCard } from "@/components/tree/NodeCard";
import { TreeNodeData, FamilyMember } from "@/lib/types";
import { SmartSuggestionsEngine } from "@/lib/utils/SmartSuggestions";
import { InteractiveLink } from "@/components/tree-editor/InteractiveLink";

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
    action: 'connect' | 'disconnect' | 'modify',
    relationshipType: 'parent' | 'spouse' | 'child' | 'sibling'
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
}

/**
 * A unified, reusable component for rendering family trees. It handles the D3 logic
 * for layout and rendering, zoom/pan functionality, and exposes a rich set of props
 * for customization and interaction.
 */
export const BaseTree = forwardRef<any, BaseTreeProps>(({
  data,
  tree,
  mainId,
  settings,
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
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const links = useLinks(tree, data, settings);
  const [zoom, setZoom] = useState(1);
  const [miniTreeData, setMiniTreeData] = useState<any | null>(null);
  const [selectedLink, setSelectedLink] = useState<{
    id: string;
    type: 'ancestry' | 'progeny' | 'spouse';
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
   * This effect sets up the D3 zoom and pan behavior on the SVG container.
   * It also exposes the zoom functions to the parent component.
   */
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });
    svg.call(zoomBehavior);

    // Calculate tree bounds and center appropriately
    const centerTree = () => {
      if (!svgRef.current || tree.length === 0) return;
      
      const svgWidth = svgRef.current.clientWidth;
      const svgHeight = svgRef.current.clientHeight;
      
      // Calculate tree bounds
      const nodeXPositions = tree.map(node => node.x).filter(x => !isNaN(x));
      const nodeYPositions = tree.map(node => node.y).filter(y => !isNaN(y));
      
      if (nodeXPositions.length === 0 || nodeYPositions.length === 0) {
        // Fallback to center if no valid positions
        const initialTransform = d3.zoomIdentity.translate(svgWidth / 2, svgHeight / 2);
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
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
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
  }, [onZoomIn, onZoomOut, onResetView, tree, settings.cardWidth, settings.cardHeight]);

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
      setMiniTreeData({
        self: node,
        parents: node.parent ? [node.parent] : null,
        siblings: node.parent
          ? (node.parent.children || []).filter((s: any) => s !== node)
          : null,
        children: node.children || [],
      });
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
      const linkParts = link.id.split('-');
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
        position: { x: clickX, y: clickY }
      });
    }
  };

  /**
   * Handles relationship modification from link interaction
   */
  const handleLinkRelationshipModify = (
    personId1: string,
    personId2: string,
    action: 'connect' | 'disconnect' | 'modify',
    relationshipType: 'parent' | 'spouse' | 'child' | 'sibling'
  ) => {
    if (onModifyRelationship) {
      onModifyRelationship(personId1, personId2, action, relationshipType);
    } else if (onRelationshipDrop && action === 'connect') {
      // Fallback to relationship drop handler for connect operations
      onRelationshipDrop(personId1, personId2, relationshipType);
    }
  };

  return (
    <div className={className} style={style}>
      <Card
        className={`relative overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
        style={{ height: settings.isFullScreen ? '100vh' : '800px' }}>
        <svg
          id={svgId}
          ref={svgRef}
          style={{
            width: "100%",
            height: "100%",
            background: isDarkMode ? "#18181b" : "#f9fafb",
            overflow: "hidden", // Prevent overflow
            display: "block",
          }}>
          <g>
            {/* Render links */}
            {links.map((link, i) => {
              // Calculate midpoint of the link for button placement
              let midPoint = { x: 0, y: 0 };
              
              // Only calculate midpoint on client side to avoid SSR issues
              if (typeof window !== 'undefined') {
                try {
                  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
                  pathEl.setAttribute("d", link.d);
                  const pathLength = pathEl.getTotalLength ? pathEl.getTotalLength() : 0;
                  if (pathLength > 0 && pathEl.getPointAtLength) {
                    midPoint = pathEl.getPointAtLength(pathLength / 2);
                  }
                } catch (error) {
                  console.warn('Error calculating path midpoint:', error);
                  // Fallback: estimate midpoint from link data
                  midPoint = { x: 0, y: 0 };
                }
              }

              return (
                <g key={link.id} className="link-group">
                  {/* Main link path */}
                  <path
                    d={link.d}
                    fill='none'
                    stroke={
                      link.relationshipType === "spouse" ? "#EC4899" : 
                      link.relationshipType === "sibling" ? "#8B5CF6" : 
                      settings.linkColor
                    }
                    strokeWidth={
                      link.relationshipType === "spouse" ? 2 : 
                      link.relationshipType === "sibling" ? 1.5 : 
                      2
                    }
                    className="transition-all duration-200"
                  />
                  {/* Interactive overlay path (wider, invisible) */}
                  <path
                    d={link.d}
                    fill='none'
                    stroke='transparent'
                    strokeWidth={12}
                    className="cursor-pointer hover:stroke-blue-400 hover:stroke-opacity-30 transition-all duration-200"
                    onClick={(e) => handleLinkClick(e, link)}
                    style={{ pointerEvents: isEditable ? 'auto' : 'none' }}
                  />
                  {/* Visual hover indicator */}
                  <path
                    d={link.d}
                    fill='none'
                    stroke={
                      link.relationshipType === "spouse" ? "#EC4899" : 
                      link.relationshipType === "sibling" ? "#8B5CF6" : 
                      settings.linkColor
                    }
                    strokeWidth={
                      link.relationshipType === "spouse" ? 3 : 
                      link.relationshipType === "sibling" ? 2.5 : 
                      3
                    }
                    className="opacity-0 hover:opacity-50 transition-opacity duration-200 pointer-events-none"
                    strokeDasharray="4,4"
                  />
                  
                  {/* Link Control Buttons - only show in edit mode */}
                  {isEditable && (
                    <g className="link-controls opacity-0 hover:opacity-100 transition-opacity duration-200">
                      {/* Remove relationship button (X) */}
                      <circle
                        cx={midPoint.x - 12}
                        cy={midPoint.y}
                        r="8"
                        fill="rgba(239, 68, 68, 0.9)"
                        stroke="white"
                        strokeWidth="1"
                        className="cursor-pointer hover:fill-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onModifyRelationship && link.personIds && link.personIds.length >= 2) {
                            onModifyRelationship(
                              link.personIds[0], 
                              link.personIds[1], 
                              'disconnect', 
                              link.relationshipType || 'parent'
                            );
                          }
                        }}
                      />
                      <text
                        x={midPoint.x - 12}
                        y={midPoint.y + 3}
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        className="pointer-events-none select-none"
                        fontWeight="bold"
                      >
                        ×
                      </text>
                      
                      {/* Add sibling/additional relationship button (+) - only for parent-child links */}
                      {link.relationshipType === 'parent' && (
                        <>
                          <circle
                            cx={midPoint.x + 12}
                            cy={midPoint.y}
                            r="8"
                            fill="rgba(34, 197, 94, 0.9)"
                            stroke="white"
                            strokeWidth="1"
                            className="cursor-pointer hover:fill-green-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (link.personIds && link.personIds.length >= 2) {
                                // Add sibling to the child
                                onAddRelative(link.personIds[1], 'sibling');
                              }
                            }}
                          />
                          <text
                            x={midPoint.x + 12}
                            y={midPoint.y + 3}
                            textAnchor="middle"
                            fontSize="10"
                            fill="white"
                            className="pointer-events-none select-none"
                            fontWeight="bold"
                          >
                            +
                          </text>
                        </>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render nodes */}
            {tree.map((node) => {
              // Use consistent card dimensions that match the settings
              const actualCardWidth = settings.cardWidth;
              const actualCardHeight = settings.cardHeight;
              const expandedWidth = actualCardWidth + 40; // Extra space for buttons
              const expandedHeight = actualCardHeight + 40;
              
              // Ensure node has valid coordinates
              const nodeX = typeof node.x === 'number' && !isNaN(node.x) ? node.x : 0;
              const nodeY = typeof node.y === 'number' && !isNaN(node.y) ? node.y : 0;

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
                        data[node.id] ? SmartSuggestionsEngine.generateSuggestions(data[node.id], data).length > 0 : false
                      }
                      maleColor={settings.maleColor}
                      femaleColor={settings.femaleColor}
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
          </g>
        </svg>
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
                {miniTreeData.children && miniTreeData.children.length > 0 && (
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
            isDarkMode={isDarkMode}
            onModifyRelationship={handleLinkRelationshipModify}
            onClose={() => setSelectedLink(null)}
          />
        )}
      </Card>
    </div>
  );
});
