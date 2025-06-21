/**
 * @file BaseTree component - a highly reusable and configurable D3-based tree visualization.
 * It can render hierarchical data directly or work with pre-calculated layouts.
 */
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Card } from "@/components/ui/card";
import { useLinks } from "@/hooks/useLinks";
import { NodeCard } from "@/components/tree/NodeCard";
import { TreeNodeData, FamilyMember } from "@/lib/types";

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
  onAddRelative: (nodeId: string, type: "parent" | "spouse" | "child") => void;
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
export const BaseTree: React.FC<BaseTreeProps> = ({
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
  onExport,
  onZoomIn,
  onZoomOut,
  onResetView,
  className,
  style,
  svgId = "family-tree-svg",
  showMiniTreeOnClick = false,
  selectedNodeId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const links = useLinks(tree, data, settings);
  const [zoom, setZoom] = useState(1);
  const [miniTreeData, setMiniTreeData] = useState<any | null>(null);

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

    // Center the tree on initial render
    if (svgRef.current) {
      const svgWidth = svgRef.current.clientWidth;
      const svgHeight = svgRef.current.clientHeight;
      const initialTransform = d3.zoomIdentity.translate(
        svgWidth / 2,
        svgHeight / 2
      );
      svg.call(zoomBehavior.transform, initialTransform);
    }

    // Optional: expose handlers
    if (onZoomIn)
      onZoomIn(() => svg.transition().call(zoomBehavior.scaleBy, 1.2));
    if (onZoomOut)
      onZoomOut(() => svg.transition().call(zoomBehavior.scaleBy, 1 / 1.2));
    if (onResetView)
      onResetView(() =>
        svg
          .transition()
          .duration(750)
          .call(
            zoomBehavior.transform,
            d3.zoomIdentity.translate(
              svgRef.current!.clientWidth / 2,
              svgRef.current!.clientHeight / 2
            )
          )
      );
  }, [onZoomIn, onZoomOut, onResetView]);

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

  return (
    <div className={className} style={style}>
      <Card
        className={`relative p-2 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <svg
          id={svgId}
          ref={svgRef}
          width={1200}
          height={800}
          style={{
            width: "100%",
            height: 800,
            background: isDarkMode ? "#18181b" : "#f9fafb",
          }}>
          <g>
            {/* Render links */}
            {links.map((link, i) => (
              <path
                key={link.id}
                d={link.d}
                fill='none'
                stroke={settings.linkColor}
                strokeWidth={link.type === "spouse" ? 1 : 2}
                // strokeLinejoin='round'
                // strokeLinecap='round'
              />
            ))}

            {/* Render nodes */}
            {tree.map((node) => (
              <foreignObject
                key={node.id}
                x={getNodeX(node) - settings.cardWidth / 2}
                y={getNodeY(node) - settings.cardHeight / 2}
                width={settings.cardWidth}
                height={settings.cardHeight}>
                <NodeCard
                  node={node}
                  isDarkMode={isDarkMode}
                  isSelected={selectedNodeId === node.id}
                  onNodeClick={onNodeClick}
                  onAddRelative={onAddRelative}
                  maleColor={settings.maleColor}
                  femaleColor={settings.femaleColor}
                  style={{
                    width: settings.cardWidth,
                    height: settings.cardHeight,
                  }}
                />
              </foreignObject>
            ))}
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
      </Card>
    </div>
  );
};
