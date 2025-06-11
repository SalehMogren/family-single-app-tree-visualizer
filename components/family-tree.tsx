"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, Users, X, Settings } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportTreeAsImage, downloadFile, generatePDF } from "@/lib/export"
import { Download } from "lucide-react"

interface FamilyMember {
  name: string
  gender: "male" | "female"
  birth_year: number
  death_year?: number
  spouse?: string
  children?: FamilyMember[]
  occupation?: string
  birthplace?: string
  notes?: string
  image?: string // Add this line
}

interface TreeNode extends d3.HierarchyNode<FamilyMember> {
  x: number
  y: number
}

interface TreeSettings {
  cardWidth: number
  cardHeight: number
  horizontalSpacing: number
  verticalSpacing: number
  margin: { top: number; right: number; bottom: number; left: number }
  maleColor: string
  femaleColor: string
  linkColor: string
  orientation: "horizontal" | "vertical"
  direction: "bottom-to-top" | "top-to-bottom" | "left-to-right" | "right-to-left"
  showLabels: {
    name: boolean
    birthYear: boolean
    deathYear: boolean
    spouse: boolean
    genderIcon: boolean
  }
  lineShape: "straight" | "curved"
  lineLength: number
}

const defaultSettings: TreeSettings = {
  cardWidth: 140,
  cardHeight: 70,
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
}

const darkSettings: TreeSettings = {
  ...defaultSettings,
  maleColor: "#3B82F6",
  femaleColor: "#EC4899",
  linkColor: "#F59E0B",
}

interface FamilyTreeProps {
  isDarkMode: boolean
}

export default function FamilyTree({ isDarkMode }: FamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [familyData, setFamilyData] = useState<FamilyMember | null>(null)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [detailNode, setDetailNode] = useState<TreeNode | null>(null)
  const [miniTreeData, setMiniTreeData] = useState<{
    parents: TreeNode[] | null
    siblings: TreeNode[] | null
    children: TreeNode[] | null
    self: TreeNode | null
  } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<TreeSettings>(defaultSettings)

  useEffect(() => {
    if (isDarkMode) {
      setSettings((prev) => ({ ...prev, ...darkSettings }))
    } else {
      setSettings((prev) => ({ ...prev, ...defaultSettings }))
    }
  }, [isDarkMode])

  useEffect(() => {
    setLoading(true)
    fetch("/data/family-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        setFamilyData(data)
        setError(null)
      })
      .catch((error) => {
        console.error("Error loading family data:", error)
        setError("فشل في تحميل بيانات العائلة")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!familyData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 1200
    const height = 800

    // Create zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform)
        setZoom(event.transform.k)
      })

    zoomRef.current = zoomBehavior
    svg.call(zoomBehavior)

    const container = svg.append("g")

    // Create hierarchy
    const root = d3.hierarchy(familyData)

    // Configure tree layout based on settings
    let treeLayout: any

    if (settings.orientation === "vertical") {
      treeLayout = d3
        .tree<FamilyMember>()
        .size([
          width - settings.margin.left - settings.margin.right,
          height - settings.margin.top - settings.margin.bottom,
        ])
        .separation((a, b) => {
          const baseSpacing = a.parent === b.parent ? settings.horizontalSpacing : settings.verticalSpacing
          // Add card width consideration to prevent overlap
          const cardSpacing = (settings.cardWidth / 100) * baseSpacing
          return Math.max(baseSpacing, cardSpacing)
        })
    } else {
      treeLayout = d3
        .tree<FamilyMember>()
        .size([
          height - settings.margin.top - settings.margin.bottom,
          width - settings.margin.left - settings.margin.right,
        ])
        .separation((a, b) => {
          const baseSpacing = a.parent === b.parent ? settings.horizontalSpacing : settings.verticalSpacing
          // Add card height consideration for horizontal layout
          const cardSpacing = (settings.cardHeight / 100) * baseSpacing
          return Math.max(baseSpacing, cardSpacing)
        })
    }

    treeLayout(root)

    // Apply direction transformations
    root.each((d: any) => {
      if (settings.orientation === "vertical") {
        if (settings.direction === "bottom-to-top") {
          d.y = height - settings.margin.top - settings.margin.bottom - d.y + settings.margin.bottom
        } else {
          d.y = d.y + settings.margin.top
        }
        d.x = d.x + settings.margin.left
      } else {
        if (settings.direction === "right-to-left") {
          d.x = d.x + settings.margin.left
          d.y = width - settings.margin.left - settings.margin.right - d.y + settings.margin.left
        } else {
          d.x = d.x + settings.margin.left
          d.y = d.y + settings.margin.left
        }
      }
    })

    // Create links (family connections)
    let linkGenerator: any

    if (settings.lineShape === "straight") {
      linkGenerator = (d: any) => {
        const sourceX = d.source.x
        const sourceY = d.source.y + settings.cardHeight / 2 // Bottom of source card
        const targetX = d.target.x
        const targetY = d.target.y - settings.cardHeight / 2 // Top of target card

        // Create neat angled lines with proper spacing
        const midY = sourceY + (targetY - sourceY) * settings.lineLength * 0.5

        return `M${sourceX},${sourceY}
            L${sourceX},${midY}
            L${targetX},${midY}
            L${targetX},${targetY}`
      }
    } else {
      // Use curved lines
      if (settings.orientation === "vertical") {
        const linkGenerator = d3
          .linkVertical<any, d3.HierarchyPointLink<FamilyMember>>()
          .x((d) => d.x)
          .y((d) => {
            if (d.source) {
              const sourceY = d.source.y
              const targetY = d.target.y
              const distance = Math.abs(targetY - sourceY)
              const direction = targetY > sourceY ? 1 : -1

              if (d === d.target) {
                return sourceY + distance * settings.lineLength * direction
              }
            }
            return d.y
          })
      } else {
        linkGenerator = d3
          .linkHorizontal<any, d3.HierarchyPointLink<FamilyMember>>()
          .x((d) => {
            if (d.source) {
              const sourceX = d.source.x
              const targetX = d.target.x
              const distance = Math.abs(targetX - sourceX)
              const direction = targetX > sourceX ? 1 : -1

              if (d === d.target) {
                return sourceX + distance * settings.lineLength * direction
              }
            }
            return d.x
          })
          .y((d) => d.y)
      }
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
      .attr("opacity", 0.7)

    // Create nodes (family members)
    const nodes = container
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation()

        // Zoom to the clicked node
        const scale = 1.5
        const translateX = width / 2 - d.x * scale
        const translateY = height / 2 - d.y * scale

        svg
          .transition()
          .duration(750)
          .call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale))

        // Show mini tree
        setSelectedNode(d)

        // Prepare mini-tree data
        const miniData = {
          self: d,
          parents: d.parent ? [d.parent] : null,
          siblings: d.parent ? d.parent.children.filter((sibling) => sibling !== d) : null,
          children: d.children || null,
        }
        setMiniTreeData(miniData)
      })
      .on("dblclick", (event, d) => {
        event.stopPropagation()
        setDetailNode(d)
      })

    // Add rectangular cards for each person
    nodes
      .append("rect")
      .attr("x", -settings.cardWidth / 2)
      .attr("y", -settings.cardHeight / 2)
      .attr("width", settings.cardWidth)
      .attr("height", settings.cardHeight)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", (d) => (d.data.gender === "male" ? settings.maleColor : settings.femaleColor))
      .attr("stroke", settings.linkColor)
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("stroke-width", 3).attr("opacity", 1)
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(200).attr("stroke-width", 2).attr("opacity", 0.9)
      })

    // Add image rendering
    nodes
      .filter((d) => d.data.image)
      .append("image")
      .attr("x", -settings.cardWidth / 2 + 10)
      .attr("y", -settings.cardHeight / 2 + 10)
      .attr("width", 30)
      .attr("height", 30)
      .attr("href", (d) => d.data.image)
      .attr("clip-path", "circle(15px)")
      .style("cursor", "pointer")

    // Add labels based on settings
    let yOffset = -settings.cardHeight / 2 + 20

    // Name label
    if (settings.showLabels.name) {
      nodes
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", yOffset)
        .attr("fill", "white")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("font-family", "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif")
        .style("direction", "rtl")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => d.data.name)
      yOffset += 20
    }

    // Birth/Death year
    if (settings.showLabels.birthYear || settings.showLabels.deathYear) {
      nodes
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", yOffset)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-family", "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => {
          let yearText = ""
          if (settings.showLabels.birthYear) yearText += d.data.birth_year
          if (settings.showLabels.deathYear && d.data.death_year) {
            yearText += settings.showLabels.birthYear ? ` - ${d.data.death_year}` : d.data.death_year
          }
          return yearText
        })
      yOffset += 15
    }

    // Spouse information
    if (settings.showLabels.spouse) {
      nodes
        .filter((d) => d.data.spouse)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", yOffset)
        .attr("fill", "white")
        .attr("font-size", "11px")
        .attr("font-family", "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif")
        .style("direction", "rtl")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => `الزوج/ة: ${d.data.spouse}`)
    }

    // Gender icons
    if (settings.showLabels.genderIcon) {
      nodes
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", settings.cardWidth / 2 - 10)
        .attr("y", -settings.cardHeight / 2 + 20)
        .attr("fill", "white")
        .attr("font-size", "16px")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text((d) => (d.data.gender === "male" ? "♂" : "♀"))
    }

    // Show the entire tree initially
    setTimeout(() => {
      const bounds = container.node()?.getBBox()
      if (bounds) {
        const fullWidth = bounds.width
        const fullHeight = bounds.height
        const midX = bounds.x + fullWidth / 2
        const midY = bounds.y + fullHeight / 2

        const scale = Math.min(width / fullWidth, height / fullHeight) * 0.9
        const translateX = width / 2 - midX * scale
        const translateY = height / 2 - midY * scale

        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale))
      }
    }, 100)

    // Close mini-tree when clicking on the background
    svg.on("click", () => {
      setSelectedNode(null)
      setMiniTreeData(null)
    })
  }, [familyData, settings])

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1 / 1.5)
    }
  }

  const handleReset = () => {
    if (svgRef.current && zoomRef.current && familyData) {
      const svg = d3.select(svgRef.current)
      const bounds = svg.select("g").node()?.getBBox()
      if (bounds) {
        const width = 1200
        const height = 800
        const fullWidth = bounds.width
        const fullHeight = bounds.height
        const midX = bounds.x + fullWidth / 2
        const midY = bounds.y + fullHeight / 2

        const scale = Math.min(width / fullWidth, height / fullHeight) * 0.9
        const translateX = width / 2 - midX * scale
        const translateY = height / 2 - midY * scale

        svg
          .transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale))
      }
    }
  }

  const closeMiniTree = () => {
    setSelectedNode(null)
    setMiniTreeData(null)
  }

  const closeDetailPanel = () => {
    setDetailNode(null)
  }

  const updateSettings = (key: keyof TreeSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateNestedSettings = (parentKey: keyof TreeSettings, childKey: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value,
      },
    }))
  }

  const resetSettings = () => {
    setSettings(isDarkMode ? darkSettings : defaultSettings)
  }

  const handleExport = async (format: "png" | "pdf") => {
    if (!svgRef.current) return

    try {
      const options = {
        format,
        quality: 0.9,
        backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
        includeWatermark: true,
      }

      const dataUrl = await exportTreeAsImage(svgRef.current, options)

      if (format === "png") {
        downloadFile(dataUrl, `family-tree-${Date.now()}.png`)
      } else {
        await generatePDF(dataUrl, `family-tree-${Date.now()}.pdf`)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("فشل في تصدير الشجرة. يرجى المحاولة مرة أخرى.")
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${isDarkMode ? "bg-gray-900" : "bg-amber-50"}`}>
        <div className="text-center">
          <Users
            className={`mx-auto h-12 w-12 mb-4 animate-pulse ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
          />
          <p
            className={`text-lg font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            جاري تحميل شجرة العائلة...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${isDarkMode ? "bg-gray-900" : "bg-amber-50"}`}>
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <p
            className="text-lg font-semibold text-red-700"
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            {error}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section
      id="family-tree"
      className={`w-full min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-amber-50 to-orange-50"
      }`}
    >
      <div className="p-6">
        <Card
          className={`border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            isDarkMode ? "border-amber-600 bg-gray-800/90" : "border-amber-200 bg-white/90"
          }`}
        >
          <div
            className={`p-4 border-b transition-colors duration-300-300-300 ${
              isDarkMode
                ? "border-amber-600 bg-gradient-to-r from-amber-900/50 to-orange-900/50"
                : "border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users
                  className={`h-5 w-5 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-700"
                  }`}
                />
                <span
                  className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  أدوات التحكم
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`border-amber-300 transition-colors duration-300 ${
                    isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className={`border-amber-300 transition-colors duration-300 ${
                    isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                  }`}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className={`border-amber-300 transition-colors duration-300 ${
                    isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                  }`}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className={`border-amber-300 transition-colors duration-300 ${
                    isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("png")}
                  className={`border-amber-300 transition-colors duration-300 ${
                    isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                  }`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  تصدير PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                  className={`border-amber-300 transition-colors duration-300 ${
                    isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                  }`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  تصدير PDF
                </Button>
                <span
                  className={`text-sm mr-2 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-300" : "text-amber-700"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  التكبير: {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div
            className={`relative overflow-hidden transition-colors duration-300 ${
              isDarkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-slate-50 to-amber-50"
            }`}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="600"
              viewBox="0 0 1200 800"
              className="cursor-move"
              style={{
                background: isDarkMode
                  ? "radial-gradient(circle at center, rgba(251, 191, 36, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)"
                  : "radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
                fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
              }}
            />

            {/* Settings Panel */}
            {showSettings && (
              <div
                className={`absolute top-0 right-0 w-80 h-full backdrop-blur-sm border-l shadow-xl overflow-y-auto transition-colors duration-300 ${
                  isDarkMode ? "bg-gray-800/95 border-amber-600" : "bg-white/95 border-amber-200"
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-amber-300" : "text-amber-800"
                      }`}
                      style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                    >
                      إعدادات الشجرة
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Card Dimensions */}
                    <div className="space-y-3">
                      <h4
                        className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        أبعاد البطاقة
                      </h4>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          العرض: {settings.cardWidth}px
                        </Label>
                        <Slider
                          value={[settings.cardWidth]}
                          onValueChange={(value) => updateSettings("cardWidth", value[0])}
                          max={250}
                          min={80}
                          step={10}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الارتفاع: {settings.cardHeight}px
                        </Label>
                        <Slider
                          value={[settings.cardHeight]}
                          onValueChange={(value) => updateSettings("cardHeight", value[0])}
                          max={120}
                          min={50}
                          step={5}
                        />
                      </div>
                    </div>

                    {/* Spacing */}
                    <div className="space-y-3">
                      <h4
                        className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        المسافات
                      </h4>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          المسافة الأفقية: {settings.horizontalSpacing.toFixed(1)}
                        </Label>
                        <Slider
                          value={[settings.horizontalSpacing]}
                          onValueChange={(value) => updateSettings("horizontalSpacing", value[0])}
                          max={5}
                          min={1.0}
                          step={0.1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          المسافة العمودية: {settings.verticalSpacing.toFixed(1)}
                        </Label>
                        <Slider
                          value={[settings.verticalSpacing]}
                          onValueChange={(value) => updateSettings("verticalSpacing", value[0])}
                          max={6}
                          min={1.5}
                          step={0.1}
                        />
                      </div>
                    </div>

                    {/* Layout */}
                    <div className="space-y-3">
                      <h4
                        className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        تخطيط الشجرة
                      </h4>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الاتجاه
                        </Label>
                        <Select
                          value={settings.orientation}
                          onValueChange={(value) => updateSettings("orientation", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vertical">عمودي</SelectItem>
                            <SelectItem value="horizontal">أفقي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الاتجاه
                        </Label>
                        <Select
                          value={settings.direction}
                          onValueChange={(value) => updateSettings("direction", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {settings.orientation === "vertical" ? (
                              <>
                                <SelectItem value="bottom-to-top">من الأسفل للأعلى</SelectItem>
                                <SelectItem value="top-to-bottom">من الأعلى للأسفل</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="left-to-right">من اليسار لليمين</SelectItem>
                                <SelectItem value="right-to-left">من اليمين لليسار</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-3">
                      <h4
                        className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        الألوان
                      </h4>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          لون الذكور
                        </Label>
                        <input
                          type="color"
                          value={settings.maleColor}
                          onChange={(e) => updateSettings("maleColor", e.target.value)}
                          className="w-full h-10 rounded border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          لون الإناث
                        </Label>
                        <input
                          type="color"
                          value={settings.femaleColor}
                          onChange={(e) => updateSettings("femaleColor", e.target.value)}
                          className="w-full h-10 rounded border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          لون الروابط
                        </Label>
                        <input
                          type="color"
                          value={settings.linkColor}
                          onChange={(e) => updateSettings("linkColor", e.target.value)}
                          className="w-full h-10 rounded border"
                        />
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="space-y-3">
                      <h4
                        className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        التسميات المعروضة
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            className={`transition-colors duration-300 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            الاسم
                          </Label>
                          <Switch
                            checked={settings.showLabels.name}
                            onCheckedChange={(checked) => updateNestedSettings("showLabels", "name", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label
                            className={`transition-colors duration-300 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            سنة الميلاد
                          </Label>
                          <Switch
                            checked={settings.showLabels.birthYear}
                            onCheckedChange={(checked) => updateNestedSettings("showLabels", "birthYear", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label
                            className={`transition-colors duration-300 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            سنة الوفاة
                          </Label>
                          <Switch
                            checked={settings.showLabels.deathYear}
                            onCheckedChange={(checked) => updateNestedSettings("showLabels", "deathYear", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label
                            className={`transition-colors duration-300 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            الزوج/ة
                          </Label>
                          <Switch
                            checked={settings.showLabels.spouse}
                            onCheckedChange={(checked) => updateNestedSettings("showLabels", "spouse", checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label
                            className={`transition-colors duration-300 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            رمز الجنس
                          </Label>
                          <Switch
                            checked={settings.showLabels.genderIcon}
                            onCheckedChange={(checked) => updateNestedSettings("showLabels", "genderIcon", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Line Settings */}
                    <div className="space-y-3">
                      <h4
                        className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-400" : "text-amber-700"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        إعدادات الخطوط
                      </h4>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          شكل الخطوط
                        </Label>
                        <Select
                          value={settings.lineShape}
                          onValueChange={(value) => updateSettings("lineShape", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="curved">منحنية</SelectItem>
                            <SelectItem value="straight">مستقيمة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          طول الخطوط: {settings.lineLength.toFixed(1)}
                        </Label>
                        <Slider
                          value={[settings.lineLength]}
                          onValueChange={(value) => updateSettings("lineLength", value[0])}
                          max={2}
                          min={0.5}
                          step={0.1}
                        />
                      </div>
                    </div>

                    {/* Reset Button */}
                    <Button
                      onClick={resetSettings}
                      variant="outline"
                      className={`w-full border-amber-300 transition-colors duration-300 ${
                        isDarkMode ? "hover:bg-amber-900/50 border-amber-600" : "hover:bg-amber-100"
                      }`}
                      style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                    >
                      إعادة تعيين الإعدادات
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div
              className={`absolute top-4 left-4 backdrop-blur-sm rounded-lg p-3 border shadow-lg transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800/90 border-amber-600" : "bg-white/90 border-amber-200"
              }`}
            >
              <h3
                className={`font-semibold mb-2 text-sm transition-colors duration-300 ${
                  isDarkMode ? "text-amber-300" : "text-amber-800"
                }`}
                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
              >
                المفتاح
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-md border-2 border-amber-400"
                    style={{ backgroundColor: settings.maleColor }}
                  ></div>
                  <span
                    className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    ذكر
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-md border-2 border-amber-400"
                    style={{ backgroundColor: settings.femaleColor }}
                  ></div>
                  <span
                    className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    أنثى
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Tree Modal */}
            {selectedNode && miniTreeData && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={closeMiniTree}
              >
                <div
                  className={`rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-amber-300" : "text-amber-800"
                      }`}
                      style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                    >
                      العلاقات المباشرة
                    </h3>
                    <Button variant="ghost" size="sm" onClick={closeMiniTree}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Selected Person */}
                    <div
                      className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                        isDarkMode
                          ? "bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-amber-600"
                          : "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300"
                      }`}
                    >
                      <h4
                        className={`font-bold mb-2 transition-colors duration-300 ${
                          isDarkMode ? "text-amber-300" : "text-amber-900"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        الشخص المحدد
                      </h4>
                      <div
                        className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
                          isDarkMode ? "bg-gray-700" : "bg-white"
                        }`}
                      >
                        <div
                          className={`border-r-4 pr-3`}
                          style={{
                            borderColor:
                              selectedNode.data.gender === "male" ? settings.maleColor : settings.femaleColor,
                          }}
                        >
                          <p
                            className={`font-bold transition-colors duration-300 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            {selectedNode.data.name}
                          </p>
                          <p
                            className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                            style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                          >
                            {selectedNode.data.birth_year}
                            {selectedNode.data.death_year ? ` - ${selectedNode.data.death_year}` : ""}
                          </p>
                          {selectedNode.data.spouse && (
                            <p
                              className="text-sm text-green-600"
                              style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                            >
                              الزوج/ة: {selectedNode.data.spouse}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parents */}
                    {miniTreeData.parents && miniTreeData.parents.length > 0 && (
                      <div
                        className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-blue-600"
                            : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
                        }`}
                      >
                        <h4
                          className={`font-bold mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-blue-300" : "text-blue-900"
                          }`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الوالدين
                        </h4>
                        <div
                          className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
                            isDarkMode ? "bg-gray-700" : "bg-white"
                          }`}
                        >
                          {miniTreeData.parents.map((parent, index) => (
                            <div
                              key={index}
                              className={`border-r-4 pr-3 mb-2 last:mb-0`}
                              style={{
                                borderColor: parent.data.gender === "male" ? settings.maleColor : settings.femaleColor,
                              }}
                            >
                              <p
                                className={`font-bold transition-colors duration-300 ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                              >
                                {parent.data.name}
                              </p>
                              <p
                                className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                              >
                                {parent.data.birth_year}
                                {parent.data.death_year ? ` - ${parent.data.death_year}` : ""}
                              </p>
                              {parent.data.spouse && (
                                <p
                                  className="text-sm text-green-600"
                                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                                >
                                  الزوج/ة: {parent.data.spouse}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Siblings */}
                    {miniTreeData.siblings && miniTreeData.siblings.length > 0 && (
                      <div
                        className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-purple-600"
                            : "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
                        }`}
                      >
                        <h4
                          className={`font-bold mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-purple-300" : "text-purple-900"
                          }`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الإخوة والأخوات
                        </h4>
                        <div
                          className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
                            isDarkMode ? "bg-gray-700" : "bg-white"
                          }`}
                        >
                          {miniTreeData.siblings.map((sibling, index) => (
                            <div
                              key={index}
                              className={`border-r-4 pr-3 mb-2 last:mb-0`}
                              style={{
                                borderColor: sibling.data.gender === "male" ? settings.maleColor : settings.femaleColor,
                              }}
                            >
                              <p
                                className={`font-bold transition-colors duration-300 ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                              >
                                {sibling.data.name}
                              </p>
                              <p
                                className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                              >
                                {sibling.data.birth_year}
                                {sibling.data.death_year ? ` - ${sibling.data.death_year}` : ""}
                              </p>
                              {sibling.data.spouse && (
                                <p
                                  className="text-sm text-green-600"
                                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                                >
                                  الزوج/ة: {sibling.data.spouse}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Children */}
                    {miniTreeData.children && miniTreeData.children.length > 0 && (
                      <div
                        className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-green-900/50 to-green-800/50 border-green-600"
                            : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                        }`}
                      >
                        <h4
                          className={`font-bold mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-green-300" : "text-green-900"
                          }`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الأبناء
                        </h4>
                        <div
                          className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
                            isDarkMode ? "bg-gray-700" : "bg-white"
                          }`}
                        >
                          {miniTreeData.children.map((child, index) => (
                            <div
                              key={index}
                              className={`border-r-4 pr-3 mb-2 last:mb-0`}
                              style={{
                                borderColor: child.data.gender === "male" ? settings.maleColor : settings.femaleColor,
                              }}
                            >
                              <p
                                className={`font-bold transition-colors duration-300 ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                              >
                                {child.data.name}
                              </p>
                              <p
                                className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                              >
                                {child.data.birth_year}
                                {child.data.death_year ? ` - ${child.data.death_year}` : ""}
                              </p>
                              {child.data.spouse && (
                                <p
                                  className="text-sm text-green-600"
                                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                                >
                                  الزوج/ة: {child.data.spouse}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detail Panel Modal */}
            {detailNode && (
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={closeDetailPanel}
              >
                <div
                  className={`rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`p-6 border-b transition-colors duration-300 ${
                      isDarkMode
                        ? "border-amber-600 bg-gradient-to-r from-amber-900/50 to-orange-900/50"
                        : "border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h2
                        className={`text-2xl font-bold transition-colors duration-300 ${
                          isDarkMode ? "text-amber-300" : "text-amber-800"
                        }`}
                        style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                      >
                        تفاصيل العضو
                      </h2>
                      <Button variant="ghost" size="sm" onClick={closeDetailPanel}>
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div
                        className={`p-6 rounded-lg border-2 transition-colors duration-300 ${
                          isDarkMode ? "bg-gray-700/50 border-amber-600" : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <h3
                          className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                            isDarkMode ? "text-amber-300" : "text-amber-800"
                          }`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          المعلومات الشخصية
                        </h3>

                        <div className="space-y-4">
                          <div
                            className={`p-4 rounded-lg transition-colors duration-300 ${
                              isDarkMode ? "bg-gray-600/50" : "bg-white/70"
                            }`}
                          >
                            <div className="flex items-center gap-4 mb-4">
                              {detailNode.data.image && (
                                <img
                                  src={detailNode.data.image || "/placeholder.svg"}
                                  alt={detailNode.data.name}
                                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-300"
                                />
                              )}
                              <div>
                                <h4
                                  className={`text-2xl font-bold transition-colors duration-300 ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                                >
                                  {detailNode.data.name}
                                </h4>
                                <p
                                  className={`text-lg transition-colors duration-300 ${
                                    isDarkMode ? "text-gray-300" : "text-gray-600"
                                  }`}
                                >
                                  {detailNode.data.birth_year}
                                  {detailNode.data.death_year ? ` - ${detailNode.data.death_year}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold transition-colors duration-300 ${
                                    isDarkMode ? "text-amber-300" : "text-amber-700"
                                  }`}
                                >
                                  الجنس:
                                </span>
                                <span
                                  className={`transition-colors duration-300 ${
                                    isDarkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  {detailNode.data.gender === "male" ? "ذكر" : "أنثى"}
                                </span>
                              </div>

                              {detailNode.data.spouse && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-semibold transition-colors duration-300 ${
                                      isDarkMode ? "text-amber-300" : "text-amber-700"
                                    }`}
                                  >
                                    الزوج/ة:
                                  </span>
                                  <span
                                    className={`transition-colors duration-300 ${
                                      isDarkMode ? "text-gray-300" : "text-gray-700"
                                    }`}
                                  >
                                    {detailNode.data.spouse}
                                  </span>
                                </div>
                              )}

                              {detailNode.data.occupation && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-semibold transition-colors duration-300 ${
                                      isDarkMode ? "text-amber-300" : "text-amber-700"
                                    }`}
                                  >
                                    المهنة:
                                  </span>
                                  <span
                                    className={`transition-colors duration-300 ${
                                      isDarkMode ? "text-gray-300" : "text-gray-700"
                                    }`}
                                  >
                                    {detailNode.data.occupation}
                                  </span>
                                </div>
                              )}

                              {detailNode.data.birthplace && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-semibold transition-colors duration-300 ${
                                      isDarkMode ? "text-amber-300" : "text-amber-700"
                                    }`}
                                  >
                                    مكان الميلاد:
                                  </span>
                                  <span
                                    className={`transition-colors duration-300 ${
                                      isDarkMode ? "text-gray-300" : "text-gray-700"
                                    }`}
                                  >
                                    {detailNode.data.birthplace}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {detailNode.data.notes && (
                            <div
                              className={`p-4 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? "bg-gray-600/50" : "bg-white/70"
                              }`}
                            >
                              <h5
                                className={`font-semibold mb-2 transition-colors duration-300 ${
                                  isDarkMode ? "text-amber-300" : "text-amber-700"
                                }`}
                              >
                                ملاحظات:
                              </h5>
                              <p
                                className={`text-sm leading-relaxed transition-colors duration-300 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{ lineHeight: "1.8" }}
                              >
                                {detailNode.data.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Family Connections */}
                      <div
                        className={`p-6 rounded-lg border-2 transition-colors duration-300 ${
                          isDarkMode ? "bg-gray-700/50 border-amber-600" : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <h3
                          className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                            isDarkMode ? "text-amber-300" : "text-amber-800"
                          }`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          الروابط العائلية
                        </h3>

                        <div className="space-y-4">
                          {detailNode.parent && (
                            <div
                              className={`p-3 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? "bg-gray-600/50" : "bg-white/70"
                              }`}
                            >
                              <h5
                                className={`font-semibold mb-2 transition-colors duration-300 ${
                                  isDarkMode ? "text-blue-300" : "text-blue-700"
                                }`}
                              >
                                الوالد/ة:
                              </h5>
                              <p
                                className={`transition-colors duration-300 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {detailNode.parent.data.name}
                              </p>
                            </div>
                          )}

                          {detailNode.children && detailNode.children.length > 0 && (
                            <div
                              className={`p-3 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? "bg-gray-600/50" : "bg-white/70"
                              }`}
                            >
                              <h5
                                className={`font-semibold mb-2 transition-colors duration-300 ${
                                  isDarkMode ? "text-green-300" : "text-green-700"
                                }`}
                              >
                                الأبناء ({detailNode.children.length}):
                              </h5>
                              <ul className="space-y-1">
                                {detailNode.children.map((child, index) => (
                                  <li
                                    key={index}
                                    className={`text-sm transition-colors duration-300 ${
                                      isDarkMode ? "text-gray-300" : "text-gray-700"
                                    }`}
                                  >
                                    • {child.data.name} ({child.data.birth_year})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {detailNode.parent?.children && detailNode.parent.children.length > 1 && (
                            <div
                              className={`p-3 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? "bg-gray-600/50" : "bg-white/70"
                              }`}
                            >
                              <h5
                                className={`font-semibold mb-2 transition-colors duration-300 ${
                                  isDarkMode ? "text-purple-300" : "text-purple-700"
                                }`}
                              >
                                الإخوة والأخوات:
                              </h5>
                              <ul className="space-y-1">
                                {detailNode.parent.children
                                  .filter((sibling) => sibling !== detailNode)
                                  .map((sibling, index) => (
                                    <li
                                      key={index}
                                      className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? "text-gray-300" : "text-gray-700"
                                      }`}
                                    >
                                      • {sibling.data.name} ({sibling.data.birth_year})
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div
            className={`absolute top-4 left-4 backdrop-blur-sm rounded-lg p-3 border shadow-lg transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800/90 border-amber-600" : "bg-white/90 border-amber-200"
            }`}
          >
            <h3
              className={`font-semibold mb-2 text-sm transition-colors duration-300 ${
                isDarkMode ? "text-amber-300" : "text-amber-800"
              }`}
              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              المفتاح
            </h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-md border-2 border-amber-400"
                  style={{ backgroundColor: settings.maleColor }}
                ></div>
                <span
                  className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  ذكر
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-md border-2 border-amber-400"
                  style={{ backgroundColor: settings.femaleColor }}
                ></div>
                <span
                  className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  أنثى
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>
  )
}
