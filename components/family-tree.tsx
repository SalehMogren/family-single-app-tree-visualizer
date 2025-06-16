"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  X,
  Settings,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportTreeAsImage, downloadFile, generatePDF } from "@/lib/export";
import { Download } from "lucide-react";

interface FamilyMember {
  name: string;
  gender: "male" | "female";
  birth_year: number;
  death_year?: number;
  spouse?: string;
  children?: FamilyMember[];
  occupation?: string;
  birthplace?: string;
  notes?: string;
  image?: string; // Add this line
}

interface TreeNode extends d3.HierarchyNode<FamilyMember> {
  x: number;
  y: number;
}

interface TreeSettings {
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
  isFullScreen: boolean;
}

const defaultSettings: TreeSettings = {
  cardWidth: 160,
  cardHeight: 90,
  horizontalSpacing: 2.0,
  verticalSpacing: 2.5,
  margin: { top: 60, right: 60, bottom: 60, left: 60 },
  maleColor: "#1E40AF",
  femaleColor: "#BE185D",
  linkColor: "#D4AF37",
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

const darkSettings: TreeSettings = {
  ...defaultSettings,
  maleColor: "#3B82F6",
  femaleColor: "#EC4899",
  linkColor: "#F59E0B",
};

interface FamilyTreeProps {
  isDarkMode: boolean;
}

export default function FamilyTree({ isDarkMode }: FamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [familyData, setFamilyData] = useState<FamilyMember | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [detailNode, setDetailNode] = useState<TreeNode | null>(null);
  const [miniTreeData, setMiniTreeData] = useState<{
    parents: TreeNode[] | null;
    siblings: TreeNode[] | null;
    children: TreeNode[] | null;
    self: TreeNode | null;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TreeSettings>(defaultSettings);

  useEffect(() => {
    if (isDarkMode) {
      setSettings((prev) => ({ ...prev, ...darkSettings }));
    } else {
      setSettings((prev) => ({ ...prev, ...defaultSettings }));
    }
  }, [isDarkMode]);

  useEffect(() => {
    setLoading(true);
    fetch("/data/family-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setFamilyData(data);
        setError(null);
      })
      .catch((error) => {
        console.error("Error loading family data:", error);
        setError("فشل في تحميل بيانات العائلة");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!familyData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 800;

    // Create zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setZoom(event.transform.k);
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    const container = svg.append("g");

    // Create hierarchy
    const root = d3.hierarchy(familyData);

    // Configure tree layout based on settings
    let treeLayout: any;

    if (settings.orientation === "vertical") {
      treeLayout = d3
        .tree<FamilyMember>()
        .size([
          width - settings.margin.left - settings.margin.right,
          height - settings.margin.top - settings.margin.bottom,
        ])
        .separation((a, b) => {
          const baseSpacing =
            a.parent === b.parent
              ? settings.horizontalSpacing
              : settings.verticalSpacing;
          // Add card width consideration to prevent overlap
          const cardSpacing = (settings.cardWidth / 100) * baseSpacing;
          return Math.max(baseSpacing, cardSpacing);
        });
    } else {
      treeLayout = d3
        .tree<FamilyMember>()
        .size([
          height - settings.margin.top - settings.margin.bottom,
          width - settings.margin.left - settings.margin.right,
        ])
        .separation((a, b) => {
          const baseSpacing =
            a.parent === b.parent
              ? settings.horizontalSpacing
              : settings.verticalSpacing;
          // Add card height consideration for horizontal layout
          const cardSpacing = (settings.cardHeight / 100) * baseSpacing;
          return Math.max(baseSpacing, cardSpacing);
        });
    }

    treeLayout(root);

    // Apply direction transformations
    root.each((d: any) => {
      if (settings.orientation === "vertical") {
        if (settings.direction === "bottom-to-top") {
          d.y =
            height -
            settings.margin.top -
            settings.margin.bottom -
            d.y +
            settings.margin.bottom;
        } else {
          d.y = d.y + settings.margin.top;
        }
        d.x = d.x + settings.margin.left;
      } else {
        if (settings.direction === "right-to-left") {
          d.x = d.x + settings.margin.left;
          d.y =
            width -
            settings.margin.left -
            settings.margin.right -
            d.y +
            settings.margin.left;
        } else {
          d.x = d.x + settings.margin.left;
          d.y = d.y + settings.margin.left;
        }
      }
    });

    // Create links (family connections)
    let linkGenerator: any;

    if (settings.lineShape === "straight") {
      linkGenerator = (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y + settings.cardHeight / 2;
        const targetX = d.target.x;
        const targetY = d.target.y - settings.cardHeight / 2;
        const midY = sourceY + (targetY - sourceY) * settings.lineLength * 0.5;

        return `M${sourceX},${sourceY}
            L${sourceX},${midY}
            L${targetX},${midY}
            L${targetX},${targetY}`;
      };
    } else {
      // Use curved lines with better control points
      linkGenerator = (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y + settings.cardHeight / 2;
        const targetX = d.target.x;
        const targetY = d.target.y - settings.cardHeight / 2;

        // Calculate control points for a smoother curve
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const controlPoint1X = sourceX + dx * 0.5;
        const controlPoint1Y = sourceY + dy * 0.25;
        const controlPoint2X = sourceX + dx * 0.5;
        const controlPoint2Y = sourceY + dy * 0.75;

        return `M${sourceX},${sourceY} 
                C${controlPoint1X},${controlPoint1Y} 
                ${controlPoint2X},${controlPoint2Y} 
                ${targetX},${targetY}`;
      };
    }

    const links = container
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", settings.linkColor)
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);

    // Create nodes (family members)
    const nodes = container
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer");

    // Add rectangular cards for each person with improved layout
    nodes
      .append("rect")
      .attr("x", -settings.cardWidth / 2)
      .attr("y", -settings.cardHeight / 2)
      .attr("width", settings.cardWidth)
      .attr("height", settings.cardHeight)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", (d) =>
        d.data.gender === "male" ? settings.maleColor : settings.femaleColor
      )
      .attr("stroke", settings.linkColor)
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))");

    // Add image rendering with better positioning
    nodes
      .filter((d: d3.HierarchyNode<FamilyMember>) => Boolean(d.data.image))
      .append("image")
      .attr("x", -settings.cardWidth / 2 + 10)
      .attr("y", -settings.cardHeight / 2 + 10)
      .attr("width", 40)
      .attr("height", 40)
      .attr("href", (d: d3.HierarchyNode<FamilyMember>) => d.data.image || "")
      .attr("clip-path", "circle(20px)")
      .style("cursor", "pointer");

    // Add labels with improved spacing
    let yOffset = -settings.cardHeight / 2 + 20;

    // Name label with better positioning
    if (settings.showLabels.name) {
      nodes
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", yOffset)
        .attr("fill", "white")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr(
          "font-family",
          "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif"
        )
        .style("direction", "rtl")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => d.data.name);
      yOffset += 25;
    }

    // Birth/Death year with better spacing
    if (settings.showLabels.birthYear || settings.showLabels.deathYear) {
      nodes
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", yOffset)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr(
          "font-family",
          "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif"
        )
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => {
          let yearText = "";
          if (settings.showLabels.birthYear) yearText += d.data.birth_year;
          if (settings.showLabels.deathYear && d.data.death_year) {
            yearText += settings.showLabels.birthYear
              ? ` - ${d.data.death_year}`
              : d.data.death_year;
          }
          return yearText;
        });
      yOffset += 20;
    }

    // Spouse information with better positioning
    if (settings.showLabels.spouse) {
      nodes
        .filter((d: d3.HierarchyNode<FamilyMember>) => Boolean(d.data.spouse))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", yOffset)
        .attr("fill", "white")
        .attr("font-size", "11px")
        .attr(
          "font-family",
          "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif"
        )
        .style("direction", "rtl")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => `الزوج/ة: ${d.data.spouse}`);
    }

    // Gender icons with better positioning
    if (settings.showLabels.genderIcon) {
      nodes
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", settings.cardWidth / 2 - 10)
        .attr("y", -settings.cardHeight / 2 + 20)
        .attr("fill", "white")
        .attr("font-size", "16px")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => (d.data.gender === "male" ? "♂" : "♀"));
    }

    // Update node click handling with zoom and mini-tree
    nodes.on("click", (event, d) => {
      event.stopPropagation();

      // Zoom to the clicked node with smooth transition
      const scale = 1.5;
      const translateX = width / 2 - (d.x || 0) * scale;
      const translateY = height / 2 - (d.y || 0) * scale;

      svg
        .transition()
        .duration(750)
        .call(
          zoomBehavior.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );

      // Show mini tree
      setSelectedNode(d as unknown as TreeNode);
      setMiniTreeData({
        self: d as unknown as TreeNode,
        parents: d.parent ? [d.parent as unknown as TreeNode] : null,
        siblings: d.parent
          ? (d.parent.children || [])
              .filter((sibling) => sibling !== d)
              .map((n) => n as unknown as TreeNode)
          : null,
        children: (d.children || []).map((n) => n as unknown as TreeNode),
      });
    });

    // Double click only shows detail panel (no zoom)
    nodes.on("dblclick", (event, d) => {
      event.stopPropagation();
      setDetailNode(d as unknown as TreeNode);
    });

    // Close panels when clicking background
    svg.on("click", (event) => {
      if (event.target === svg.node()) {
        setSelectedNode(null);
        setMiniTreeData(null);
        setDetailNode(null);
      }
    });

    // Add zoom behavior for the entire tree
    svg.on("click", (event) => {
      if (event.target === svg.node()) {
        // Only zoom when clicking on the background
        const scale = 1.5;
        const translateX = width / 2;
        const translateY = height / 2;

        svg
          .transition()
          .duration(750)
          .call(
            zoomBehavior.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
    });

    // Show the entire tree initially with smooth transition
    setTimeout(() => {
      const bounds = (container.node() as SVGGElement)?.getBBox();
      if (bounds) {
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;

        const scale = Math.min(width / fullWidth, height / fullHeight) * 0.9;
        const translateX = width / 2 - midX * scale;
        const translateY = height / 2 - midY * scale;

        svg
          .transition()
          .duration(1000)
          .call(
            zoomBehavior.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
    }, 100);
  }, [familyData, settings]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1 / 1.5);
    }
  };

  const handleReset = () => {
    if (svgRef.current && zoomRef.current && familyData) {
      const svg = d3.select(svgRef.current);
      const bounds = (svg.select("g").node() as SVGGElement)?.getBBox();
      if (bounds) {
        const width = 1200;
        const height = 800;
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;

        const scale = Math.min(width / fullWidth, height / fullHeight) * 0.9;
        const translateX = width / 2 - midX * scale;
        const translateY = height / 2 - midY * scale;

        svg
          .transition()
          .duration(750)
          .call(
            zoomRef.current.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
    }
  };

  const closeMiniTree = () => {
    setSelectedNode(null);
    setMiniTreeData(null);
  };

  const closeDetailPanel = () => {
    setDetailNode(null);
  };

  const updateSettings = (key: keyof TreeSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedSettings = (
    parentKey: keyof TreeSettings,
    childKey: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value,
      },
    }));
  };

  const resetSettings = () => {
    setSettings(isDarkMode ? darkSettings : defaultSettings);
  };

  const handleExport = async (format: "png" | "pdf") => {
    if (!svgRef.current) return;

    try {
      const options = {
        format,
        quality: 0.9,
        backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
        includeWatermark: true,
      };

      const dataUrl = await exportTreeAsImage(svgRef.current, options);

      if (format === "png") {
        downloadFile(dataUrl, `family-tree-${Date.now()}.png`);
      } else {
        await generatePDF(dataUrl, `family-tree-${Date.now()}.pdf`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("فشل في تصدير الشجرة. يرجى المحاولة مرة أخرى.");
    }
  };

  const toggleFullScreen = () => {
    setSettings((prev) => ({ ...prev, isFullScreen: !prev.isFullScreen }));
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-96 ${
          isDarkMode ? "bg-gray-900" : "bg-amber-50"
        }`}>
        <div className='text-center'>
          <Users
            className={`mx-auto h-12 w-12 mb-4 animate-pulse ${
              isDarkMode ? "text-amber-400" : "text-amber-600"
            }`}
          />
          <p
            className={`text-lg font-semibold ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
            style={{
              fontFamily:
                "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
            }}>
            جاري تحميل شجرة العائلة...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center h-96 ${
          isDarkMode ? "bg-gray-900" : "bg-amber-50"
        }`}>
        <div className='text-center'>
          <Users className='mx-auto h-12 w-12 text-red-600 mb-4' />
          <p
            className='text-lg font-semibold text-red-700'
            style={{
              fontFamily:
                "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
            }}>
            {error}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className='mt-4'
            style={{
              fontFamily:
                "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
            }}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section
      id='family-tree'
      className={`w-full min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-amber-50 to-orange-50"
      }`}>
      <div
        className={`relative ${
          settings.isFullScreen ? "fixed inset-0 z-50 bg-background" : ""
        }`}>
        {/* Main Tree View */}
        <div className='p-6'>
          <Card
            className={`border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
              isDarkMode
                ? "border-amber-600 bg-gray-800/90"
                : "border-amber-200 bg-white/90"
            }`}>
            <div
              className={`p-4 border-b transition-colors duration-300-300-300 ${
                isDarkMode
                  ? "border-amber-600 bg-gradient-to-r from-amber-900/50 to-orange-900/50"
                  : "border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100"
              }`}>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Users
                    className={`h-5 w-5 transition-colors duration-300 ${
                      isDarkMode ? "text-amber-400" : "text-amber-700"
                    }`}
                  />
                  <span
                    className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }`}
                    style={{
                      fontFamily:
                        "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                    }}>
                    أدوات التحكم
                  </span>
                </div>
                <div className='flex items-center gap-2 flex-wrap justify-end'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowSettings(!showSettings)}
                    className={`border-amber-300 transition-colors duration-300 ${
                      isDarkMode
                        ? "hover:bg-amber-900/50 border-amber-600"
                        : "hover:bg-amber-100"
                    }`}>
                    <Settings className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleZoomIn}
                    className={`border-amber-300 transition-colors duration-300 ${
                      isDarkMode
                        ? "hover:bg-amber-900/50 border-amber-600"
                        : "hover:bg-amber-100"
                    }`}>
                    <ZoomIn className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleZoomOut}
                    className={`border-amber-300 transition-colors duration-300 ${
                      isDarkMode
                        ? "hover:bg-amber-900/50 border-amber-600"
                        : "hover:bg-amber-100"
                    }`}>
                    <ZoomOut className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleReset}
                    className={`border-amber-300 transition-colors duration-300 ${
                      isDarkMode
                        ? "hover:bg-amber-900/50 border-amber-600"
                        : "hover:bg-amber-100"
                    }`}>
                    <RotateCcw className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExport("png")}
                    className={`border-amber-300 transition-colors duration-300 ${
                      isDarkMode
                        ? "hover:bg-amber-900/50 border-amber-600"
                        : "hover:bg-amber-100"
                    }`}>
                    <Download className='h-4 w-4 mr-1' />
                    تصدير PNG
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExport("pdf")}
                    className={`border-amber-300 transition-colors duration-300 ${
                      isDarkMode
                        ? "hover:bg-amber-900/50 border-amber-600"
                        : "hover:bg-amber-100"
                    }`}>
                    <Download className='h-4 w-4 mr-1' />
                    تصدير PDF
                  </Button>
                  <span
                    className={`text-sm mr-2 transition-colors duration-300 ${
                      isDarkMode ? "text-amber-300" : "text-amber-700"
                    }`}
                    style={{
                      fontFamily:
                        "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                    }}>
                    التكبير: {Math.round(zoom * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`relative overflow-hidden transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900"
                  : "bg-gradient-to-br from-slate-50 to-amber-50"
              }`}>
              <svg
                ref={svgRef}
                width='100%'
                height='600'
                viewBox='0 0 1200 800'
                className='cursor-move'
                style={{
                  background: isDarkMode
                    ? "radial-gradient(circle at center, rgba(251, 191, 36, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)"
                    : "radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
                  fontFamily:
                    "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                }}
              />
            </div>
          </Card>
        </div>

        {/* Mini Tree Panel */}
        {selectedNode && miniTreeData && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
            <Card
              className={`w-[90%] max-w-4xl p-6 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}>
              <div className='flex items-center justify-between mb-6'>
                <h2
                  className={`text-xl font-semibold ${
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  }`}
                  style={{
                    fontFamily:
                      "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                  }}>
                  شجرة العائلة المصغرة
                </h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={closeMiniTree}
                  className='hover:bg-amber-100'>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                {/* Parents Section */}
                {miniTreeData.parents && (
                  <div className='space-y-4'>
                    <h3
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-amber-300" : "text-amber-800"
                      }`}>
                      الوالدين
                    </h3>
                    {miniTreeData.parents.map((parent) => (
                      <div
                        key={parent.data.name}
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-amber-50"
                        }`}>
                        <p className='font-semibold'>{parent.data.name}</p>
                        <p className='text-sm'>
                          {parent.data.birth_year}
                          {parent.data.death_year
                            ? ` - ${parent.data.death_year}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Siblings Section */}
                {miniTreeData.siblings && (
                  <div className='space-y-4'>
                    <h3
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-amber-300" : "text-amber-800"
                      }`}>
                      الإخوة
                    </h3>
                    {miniTreeData.siblings.map((sibling) => (
                      <div
                        key={sibling.data.name}
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-amber-50"
                        }`}>
                        <p className='font-semibold'>{sibling.data.name}</p>
                        <p className='text-sm'>
                          {sibling.data.birth_year}
                          {sibling.data.death_year
                            ? ` - ${sibling.data.death_year}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Person */}
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
                      {miniTreeData.self.data.spouse && (
                        <p className='text-sm mt-2'>
                          الزوج/ة: {miniTreeData.self.data.spouse}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Children Section */}
                {miniTreeData.children && (
                  <div className='space-y-4'>
                    <h3
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-amber-300" : "text-amber-800"
                      }`}>
                      الأبناء
                    </h3>
                    {miniTreeData.children.map((child) => (
                      <div
                        key={child.data.name}
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-amber-50"
                        }`}>
                        <p className='font-semibold'>{child.data.name}</p>
                        <p className='text-sm'>
                          {child.data.birth_year}
                          {child.data.death_year
                            ? ` - ${child.data.death_year}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Detail Panel */}
        {detailNode && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
            <Card
              className={`w-[90%] max-w-2xl p-6 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}>
              <div className='flex items-center justify-between mb-6'>
                <h2
                  className={`text-xl font-semibold ${
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  }`}
                  style={{
                    fontFamily:
                      "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                  }}>
                  تفاصيل العضو
                </h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={closeDetailPanel}
                  className='hover:bg-amber-100'>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-6'>
                {/* Basic Info */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm'>الاسم</Label>
                    <p className='font-semibold'>{detailNode.data.name}</p>
                  </div>
                  <div>
                    <Label className='text-sm'>الجنس</Label>
                    <p className='font-semibold'>
                      {detailNode.data.gender === "male" ? "ذكر" : "أنثى"}
                    </p>
                  </div>
                  <div>
                    <Label className='text-sm'>سنة الميلاد</Label>
                    <p className='font-semibold'>
                      {detailNode.data.birth_year}
                    </p>
                  </div>
                  {detailNode.data.death_year && (
                    <div>
                      <Label className='text-sm'>سنة الوفاة</Label>
                      <p className='font-semibold'>
                        {detailNode.data.death_year}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {detailNode.data.spouse && (
                  <div>
                    <Label className='text-sm'>الزوج/ة</Label>
                    <p className='font-semibold'>{detailNode.data.spouse}</p>
                  </div>
                )}
                {detailNode.data.occupation && (
                  <div>
                    <Label className='text-sm'>المهنة</Label>
                    <p className='font-semibold'>
                      {detailNode.data.occupation}
                    </p>
                  </div>
                )}
                {detailNode.data.birthplace && (
                  <div>
                    <Label className='text-sm'>مكان الميلاد</Label>
                    <p className='font-semibold'>
                      {detailNode.data.birthplace}
                    </p>
                  </div>
                )}
                {detailNode.data.notes && (
                  <div>
                    <Label className='text-sm'>ملاحظات</Label>
                    <p className='font-semibold'>{detailNode.data.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
            <Card
              className={`w-[90%] max-w-2xl p-6 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}>
              <div className='flex items-center justify-between mb-6'>
                <h2
                  className={`text-xl font-semibold ${
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  }`}
                  style={{
                    fontFamily:
                      "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                  }}>
                  إعدادات الشجرة
                </h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowSettings(false)}
                  className='hover:bg-amber-100'>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-6'>
                {/* Card Size */}
                <div className='space-y-2'>
                  <Label
                    className={
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }>
                    حجم البطاقة
                  </Label>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm'>العرض</Label>
                      <Slider
                        value={[settings.cardWidth]}
                        min={100}
                        max={200}
                        step={10}
                        onValueChange={(value) =>
                          updateSettings("cardWidth", value[0])
                        }
                      />
                    </div>
                    <div>
                      <Label className='text-sm'>الارتفاع</Label>
                      <Slider
                        value={[settings.cardHeight]}
                        min={50}
                        max={150}
                        step={10}
                        onValueChange={(value) =>
                          updateSettings("cardHeight", value[0])
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Spacing */}
                <div className='space-y-2'>
                  <Label
                    className={
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }>
                    المسافات
                  </Label>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm'>أفقي</Label>
                      <Slider
                        value={[settings.horizontalSpacing]}
                        min={1}
                        max={5}
                        step={0.1}
                        onValueChange={(value) =>
                          updateSettings("horizontalSpacing", value[0])
                        }
                      />
                    </div>
                    <div>
                      <Label className='text-sm'>عمودي</Label>
                      <Slider
                        value={[settings.verticalSpacing]}
                        min={1}
                        max={5}
                        step={0.1}
                        onValueChange={(value) =>
                          updateSettings("verticalSpacing", value[0])
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className='space-y-2'>
                  <Label
                    className={
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }>
                    الألوان
                  </Label>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <Label className='text-sm'>ذكر</Label>
                      <input
                        type='color'
                        value={settings.maleColor}
                        onChange={(e) =>
                          updateSettings("maleColor", e.target.value)
                        }
                        className='w-full h-8 rounded cursor-pointer'
                      />
                    </div>
                    <div>
                      <Label className='text-sm'>أنثى</Label>
                      <input
                        type='color'
                        value={settings.femaleColor}
                        onChange={(e) =>
                          updateSettings("femaleColor", e.target.value)
                        }
                        className='w-full h-8 rounded cursor-pointer'
                      />
                    </div>
                    <div>
                      <Label className='text-sm'>الخطوط</Label>
                      <input
                        type='color'
                        value={settings.linkColor}
                        onChange={(e) =>
                          updateSettings("linkColor", e.target.value)
                        }
                        className='w-full h-8 rounded cursor-pointer'
                      />
                    </div>
                  </div>
                </div>

                {/* Orientation */}
                <div className='space-y-2'>
                  <Label
                    className={
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }>
                    الاتجاه
                  </Label>
                  <div className='grid grid-cols-2 gap-4'>
                    <Select
                      value={settings.orientation}
                      onValueChange={(value) =>
                        updateSettings("orientation", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder='اختر الاتجاه' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='vertical'>عمودي</SelectItem>
                        <SelectItem value='horizontal'>أفقي</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={settings.direction}
                      onValueChange={(value) =>
                        updateSettings("direction", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder='اختر الاتجاه' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='bottom-to-top'>
                          من أسفل إلى أعلى
                        </SelectItem>
                        <SelectItem value='top-to-bottom'>
                          من أعلى إلى أسفل
                        </SelectItem>
                        <SelectItem value='left-to-right'>
                          من اليسار إلى اليمين
                        </SelectItem>
                        <SelectItem value='right-to-left'>
                          من اليمين إلى اليسار
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Display Options */}
                <div className='space-y-2'>
                  <Label
                    className={
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }>
                    خيارات العرض
                  </Label>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        checked={settings.showLabels.name}
                        onCheckedChange={(checked) =>
                          updateNestedSettings("showLabels", "name", checked)
                        }
                      />
                      <Label>الاسم</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        checked={settings.showLabels.birthYear}
                        onCheckedChange={(checked) =>
                          updateNestedSettings(
                            "showLabels",
                            "birthYear",
                            checked
                          )
                        }
                      />
                      <Label>سنة الميلاد</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        checked={settings.showLabels.deathYear}
                        onCheckedChange={(checked) =>
                          updateNestedSettings(
                            "showLabels",
                            "deathYear",
                            checked
                          )
                        }
                      />
                      <Label>سنة الوفاة</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        checked={settings.showLabels.spouse}
                        onCheckedChange={(checked) =>
                          updateNestedSettings("showLabels", "spouse", checked)
                        }
                      />
                      <Label>الزوج/ة</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        checked={settings.showLabels.genderIcon}
                        onCheckedChange={(checked) =>
                          updateNestedSettings(
                            "showLabels",
                            "genderIcon",
                            checked
                          )
                        }
                      />
                      <Label>رمز الجنس</Label>
                    </div>
                  </div>
                </div>

                {/* Line Options */}
                <div className='space-y-2'>
                  <Label
                    className={
                      isDarkMode ? "text-amber-300" : "text-amber-800"
                    }>
                    خيارات الخطوط
                  </Label>
                  <div className='grid grid-cols-2 gap-4'>
                    <Select
                      value={settings.lineShape}
                      onValueChange={(value) =>
                        updateSettings("lineShape", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder='شكل الخط' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='straight'>مستقيم</SelectItem>
                        <SelectItem value='curved'>منحني</SelectItem>
                      </SelectContent>
                    </Select>
                    <div>
                      <Label className='text-sm'>طول الخط</Label>
                      <Slider
                        value={[settings.lineLength]}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        onValueChange={(value) =>
                          updateSettings("lineLength", value[0])
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className='flex justify-end'>
                  <Button
                    variant='outline'
                    onClick={resetSettings}
                    className={`${
                      isDarkMode
                        ? "border-amber-600 hover:bg-amber-900/50"
                        : "border-amber-300 hover:bg-amber-100"
                    }`}>
                    إعادة تعيين الإعدادات
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mobile Full Screen Button */}
        <div className='md:hidden fixed bottom-4 right-4 z-50'>
          <Button
            variant='outline'
            size='sm'
            className='bg-background/80 backdrop-blur-sm'
            onClick={toggleFullScreen}>
            {settings.isFullScreen ? (
              <Minimize2 className='h-4 w-4' />
            ) : (
              <Maximize2 className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
