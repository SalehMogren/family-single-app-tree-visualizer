"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Upload,
  ArrowLeft,
  Plus,
  X,
  Settings,
  User,
  Users,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as d3 from "d3"

interface FamilyMember {
  id: string
  name: string
  gender: "male" | "female"
  birth_year: number
  death_year?: number
  spouse?: string
  spouseId?: string
  children?: FamilyMember[]
  occupation?: string
  birthplace?: string
  notes?: string
  image?: string
  parentId?: string
  x?: number
  y?: number
}

interface TreeNode extends d3.HierarchyNode<FamilyMember> {
  x: number
  y: number
}

interface DetailPanelSettings {
  enableDetailView: boolean
  viewOnly: boolean
  editOnClick: boolean
}

interface FieldConfig {
  id: string
  name: string
  type: "text" | "number" | "date" | "image"
  required: boolean
  editable: boolean
}

const defaultFields: FieldConfig[] = [
  { id: "name", name: "الاسم الأول", type: "text", required: true, editable: true },
  { id: "surname", name: "اسم العائلة", type: "text", required: true, editable: true },
  { id: "birth_year", name: "سنة الميلاد", type: "number", required: true, editable: true },
  { id: "image", name: "الصورة", type: "image", required: false, editable: true },
]

export default function TreeEditor() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [familyData, setFamilyData] = useState<FamilyMember | null>(null)
  const [selectedNode, setSelectedNode] = useState<FamilyMember | null>(null)
  const [editingNode, setEditingNode] = useState<Partial<FamilyMember>>({})
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showAddOptions, setShowAddOptions] = useState<{
    nodeId: string
    type: "parent" | "spouse" | "child"
    position: { x: number; y: number }
  } | null>(null)

  // Panel settings
  const [detailSettings, setDetailSettings] = useState<DetailPanelSettings>({
    enableDetailView: true,
    viewOnly: false,
    editOnClick: true,
  })

  const [fields, setFields] = useState<FieldConfig[]>(defaultFields)

  // Initialize with sample data
  useEffect(() => {
    const sampleData: FamilyMember = {
      id: "root",
      name: "أحمد محمد",
      gender: "male",
      birth_year: 1970,
      children: [],
    }
    setFamilyData(sampleData)
    setSelectedNode(sampleData)
    setEditingNode(sampleData)
  }, [])

  // Toggle dark mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const findNodeById = (node: FamilyMember, id: string): FamilyMember | null => {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id)
        if (found) return found
      }
    }
    return null
  }

  const updateNode = (node: FamilyMember, updatedNode: FamilyMember): FamilyMember => {
    if (node.id === updatedNode.id) {
      return { ...updatedNode, children: node.children }
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map((child) => updateNode(child, updatedNode)),
      }
    }
    return node
  }

  const addRelative = (targetId: string, newMember: FamilyMember, relationType: "parent" | "spouse" | "child") => {
    if (!familyData) return

    const newTree = { ...familyData }
    const targetNode = findNodeById(newTree, targetId)

    if (!targetNode) return

    if (relationType === "child") {
      if (!targetNode.children) targetNode.children = []
      targetNode.children.push({ ...newMember, parentId: targetId })
    } else if (relationType === "spouse") {
      // Add spouse relationship
      targetNode.spouse = newMember.name
      targetNode.spouseId = newMember.id

      // Create a new node for the spouse if needed
      // In a real app, you might want to add this to a separate spouses array
      // For simplicity, we're just updating the spouse property
    } else if (relationType === "parent") {
      // This is more complex as we need to restructure the tree
      // For simplicity, we'll just create a new parent node and make the target a child

      // If this is the root node, we need special handling
      if (targetId === newTree.id) {
        // Create a new root with the current root as a child
        const newRoot = {
          ...newMember,
          children: [newTree],
        }
        setFamilyData(newRoot)
        return
      }

      // Otherwise, find the parent of the target node and replace the target with the new parent
      // This is a simplified approach - a real implementation would be more complex
      const replaceInTree = (node: FamilyMember): FamilyMember => {
        if (!node.children) return node

        const childIndex = node.children.findIndex((child) => child.id === targetId)
        if (childIndex >= 0) {
          // Found the parent, replace the child with the new parent
          const newChildren = [...node.children]
          newChildren[childIndex] = { ...newMember, children: [node.children[childIndex]] }
          return { ...node, children: newChildren }
        }

        // Continue searching
        return {
          ...node,
          children: node.children.map(replaceInTree),
        }
      }

      setFamilyData(replaceInTree(newTree))
      return
    }

    setFamilyData(newTree)
  }

  const deleteNode = (nodeId: string) => {
    if (!familyData || nodeId === familyData.id) return

    const deleteFromNode = (node: FamilyMember): FamilyMember => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter((child) => child.id !== nodeId).map(deleteFromNode),
        }
      }
      return node
    }

    setFamilyData(deleteFromNode(familyData))
    setSelectedNode(null)
    setEditingNode({})
  }

  const handleSave = () => {
    if (!familyData || !selectedNode || !editingNode.name) return

    const updatedNode: FamilyMember = {
      ...selectedNode,
      ...editingNode,
      birth_year: editingNode.birth_year || selectedNode.birth_year,
      children: selectedNode.children || [],
    }

    const updatedTree = updateNode(familyData, updatedNode)
    setFamilyData(updatedTree)
    setSelectedNode(updatedNode)
  }

  const exportData = () => {
    if (!familyData) return

    const dataStr = JSON.stringify(familyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `family-tree-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        setFamilyData(data)
        setSelectedNode(data)
        setEditingNode(data)
      } catch (error) {
        alert("خطأ في قراءة الملف. تأكد من أن الملف بصيغة JSON صحيحة.")
      }
    }
    reader.readAsText(file)
  }

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
        const width = 800
        const height = 600
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

  // Render tree visualization
  useEffect(() => {
    if (!familyData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 800
    const height = 600
    const margin = { top: 50, right: 50, bottom: 50, left: 50 }

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

    // Create tree layout
    const treeLayout = d3
      .tree<FamilyMember>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .separation((a, b) => (a.parent === b.parent ? 1.5 : 2))

    treeLayout(root)

    // Position nodes
    root.each((d: any) => {
      d.y = d.depth * 120 + margin.top
      d.x = d.x + margin.left
    })

    // Create links with proper updates on drag
    const linkGenerator = d3
      .linkVertical<any, any>()
      .x((d: any) => d.x)
      .y((d: any) => d.y)

    const links = container
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", "#D4AF37")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7)

    // Update links function for drag
    function updateLinks() {
      container.selectAll(".link").attr("d", linkGenerator)
    }

    // Create nodes
    const nodes = container
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, any>().on("start", dragStarted).on("drag", dragged).on("end", dragEnded))

    function dragStarted(event: any, d: any) {
      d3.select(this).raise().attr("stroke", "black")
    }

    function dragged(event: any, d: any) {
      d3.select(this).attr("transform", `translate(${event.x},${event.y})`)
      d.x = event.x
      d.y = event.y

      // Update links when dragging
      updateLinks()
    }

    function dragEnded(event: any, d: any) {
      d3.select(this).attr("stroke", null)

      // Select the node when drag ends
      setSelectedNode(d.data)
      setEditingNode(d.data)
    }

    // Add node backgrounds
    nodes
      .append("rect")
      .attr("x", -80)
      .attr("y", -35)
      .attr("width", 160)
      .attr("height", 70)
      .attr("rx", 8)
      .attr("fill", (d: any) => {
        if (selectedNode && d.data.id === selectedNode.id) {
          return "#FCD34D"
        }
        return d.data.gender === "male" ? "#1E40AF" : "#BE185D"
      })
      .attr("stroke", "#D4AF37")
      .attr("stroke-width", 2)
      .on("click", (event, d: any) => {
        event.stopPropagation()
        setSelectedNode(d.data)
        setEditingNode(d.data)
      })

    // Add images if available
    nodes
      .filter((d: any) => d.data.image)
      .append("image")
      .attr("x", -70)
      .attr("y", -25)
      .attr("width", 30)
      .attr("height", 30)
      .attr("href", (d: any) => d.data.image)
      .attr("clip-path", "circle(15px)")

    // Add names
    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -10)
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text((d: any) => d.data.name)

    // Add birth year
    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 10)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text((d: any) => d.data.birth_year)

    // Add relationship buttons around selected node
    if (selectedNode) {
      const selectedD3Node = root.descendants().find((d) => d.data.id === selectedNode.id)
      if (selectedD3Node) {
        const nodeGroup = container
          .append("g")
          .attr("class", "relationship-buttons")
          .attr("transform", `translate(${selectedD3Node.x},${selectedD3Node.y})`)

        // Add Father button (top-left)
        const fatherButton = nodeGroup
          .append("g")
          .attr("transform", "translate(-120, -80)")
          .style("cursor", "pointer")
          .on("click", () => {
            const newFather: FamilyMember = {
              id: generateId(),
              name: "الوالد",
              gender: "male",
              birth_year: selectedNode.birth_year - 30,
            }
            addRelative(selectedNode.id, newFather, "parent")
          })

        fatherButton
          .append("rect")
          .attr("x", -40)
          .attr("y", -20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", "none")
          .attr("stroke", "#10B981")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")

        fatherButton
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 5)
          .attr("fill", "#10B981")
          .attr("font-size", "12px")
          .text("إضافة الوالد")

        // Add Mother button (top-right)
        const motherButton = nodeGroup
          .append("g")
          .attr("transform", "translate(120, -80)")
          .style("cursor", "pointer")
          .on("click", () => {
            const newMother: FamilyMember = {
              id: generateId(),
              name: "الوالدة",
              gender: "female",
              birth_year: selectedNode.birth_year - 28,
            }
            addRelative(selectedNode.id, newMother, "parent")
          })

        motherButton
          .append("rect")
          .attr("x", -40)
          .attr("y", -20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", "none")
          .attr("stroke", "#EC4899")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")

        motherButton
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 5)
          .attr("fill", "#EC4899")
          .attr("font-size", "12px")
          .text("إضافة الوالدة")

        // Add Spouse button (right)
        const spouseButton = nodeGroup
          .append("g")
          .attr("transform", "translate(200, 0)")
          .style("cursor", "pointer")
          .on("click", () => {
            const newSpouse: FamilyMember = {
              id: generateId(),
              name: selectedNode.gender === "male" ? "الزوجة" : "الزوج",
              gender: selectedNode.gender === "male" ? "female" : "male",
              birth_year: selectedNode.birth_year,
            }
            addRelative(selectedNode.id, newSpouse, "spouse")
          })

        spouseButton
          .append("rect")
          .attr("x", -40)
          .attr("y", -20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", "none")
          .attr("stroke", "#F59E0B")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")

        spouseButton
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 5)
          .attr("fill", "#F59E0B")
          .attr("font-size", "12px")
          .text("إضافة الزوج/ة")

        // Add Son button (bottom-left)
        const sonButton = nodeGroup
          .append("g")
          .attr("transform", "translate(-120, 80)")
          .style("cursor", "pointer")
          .on("click", () => {
            const newSon: FamilyMember = {
              id: generateId(),
              name: "الابن",
              gender: "male",
              birth_year: selectedNode.birth_year + 25,
              parentId: selectedNode.id,
            }
            addRelative(selectedNode.id, newSon, "child")
          })

        sonButton
          .append("rect")
          .attr("x", -40)
          .attr("y", -20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", "none")
          .attr("stroke", "#3B82F6")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")

        sonButton
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 5)
          .attr("fill", "#3B82F6")
          .attr("font-size", "12px")
          .text("إضافة ابن")

        // Add Daughter button (bottom-right)
        const daughterButton = nodeGroup
          .append("g")
          .attr("transform", "translate(120, 80)")
          .style("cursor", "pointer")
          .on("click", () => {
            const newDaughter: FamilyMember = {
              id: generateId(),
              name: "الابنة",
              gender: "female",
              birth_year: selectedNode.birth_year + 25,
              parentId: selectedNode.id,
            }
            addRelative(selectedNode.id, newDaughter, "child")
          })

        daughterButton
          .append("rect")
          .attr("x", -40)
          .attr("y", -20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", "none")
          .attr("stroke", "#EC4899")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")

        daughterButton
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 5)
          .attr("fill", "#EC4899")
          .attr("font-size", "12px")
          .text("إضافة ابنة")
      }
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
  }, [familyData, selectedNode])

  if (!familyData) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? "bg-gray-900" : "bg-amber-50"}`}>
        <div className="text-center">
          <Users
            className={`mx-auto h-12 w-12 mb-4 animate-pulse ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
          />
          <p className={`text-lg font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            جاري تحميل محرر الشجرة...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""} bg-gray-50 dark:bg-gray-900 flex`} dir="rtl">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة للرئيسية
            </Button>
            <h1 className="text-2xl font-bold dark:text-white">محرر شجرة العائلة</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleTheme} className="flex items-center gap-2">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              استيراد
            </Button>
            <Button onClick={exportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير JSON
            </Button>
          </div>
        </div>
      </div>
      {/* Left Panel - Detail Panel */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-20 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold dark:text-white">لوحة التفاصيل</h2>
          </div>

          {/* Single Legend */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-3 dark:text-white">المفتاح</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm dark:text-gray-300">ذكر</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-600 rounded"></div>
                <span className="text-sm dark:text-gray-300">أنثى</span>
              </div>
            </div>
          </div>

          {/* Panel Settings */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm dark:text-gray-300">تفعيل عرض التفاصيل</span>
              </div>
              <Switch
                checked={detailSettings.enableDetailView}
                onCheckedChange={(checked) => setDetailSettings((prev) => ({ ...prev, enableDetailView: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm dark:text-gray-300">عرض فقط</span>
              </div>
              <Switch
                checked={detailSettings.viewOnly}
                onCheckedChange={(checked) => setDetailSettings((prev) => ({ ...prev, viewOnly: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm dark:text-gray-300">تحرير عند النقر</span>
              </div>
              <Switch
                checked={detailSettings.editOnClick}
                onCheckedChange={(checked) => setDetailSettings((prev) => ({ ...prev, editOnClick: checked }))}
              />
            </div>
          </div>

          {/* Fields Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold dark:text-white">الحقول</h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium dark:text-gray-300">الحقول القابلة للتحرير</span>
                <Button size="sm" variant="outline" className="text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  إضافة حقل
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {fields
                  .filter((f) => f.editable)
                  .map((field) => (
                    <Badge
                      key={field.id}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {field.name}
                      <X className="h-3 w-3 mr-1 cursor-pointer" />
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      ;
      <div className="flex-1 pt-20 bg-gray-50 dark:bg-gray-900">
        <div className="h-full p-6">
          <Card className="h-full border-2 shadow-xl dark:border-gray-700">
            <div className="h-full relative overflow-hidden bg-gradient-to-br from-slate-50 to-amber-50 dark:from-gray-800 dark:to-gray-900">
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 800 600"
                className="cursor-move"
                style={{
                  fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                }}
              />

              {/* Tree Controls */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Button size="sm" variant="outline" className="bg-white/90 dark:bg-gray-800/90" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/90 dark:bg-gray-800/90" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/90 dark:bg-gray-800/90" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/90 dark:bg-gray-800/90">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom Info */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded text-xs">
                التكبير: {Math.round(zoom * 100)}%
              </div>

              {/* Data Format Tabs */}
              <div className="absolute bottom-4 left-4 flex gap-1 bg-white/90 dark:bg-gray-800/90 rounded-lg p-1">
                <Button size="sm" variant="ghost" className="text-xs">
                  DATA
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  FULL HTML
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  VUE
                </Button>
                <Button size="sm" variant="ghost" className="text-xs bg-blue-100 dark:bg-blue-900 dark:text-blue-200">
                  REACT
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      ;
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 pt-20 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 dark:text-gray-300" />
              <X className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {selectedNode ? (
            <div className="space-y-6">
              {/* Gender Selection */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={editingNode.gender === "male"}
                      onChange={(e) => setEditingNode({ ...editingNode, gender: "male" })}
                      className="text-blue-600"
                    />
                    <span className="text-sm dark:text-gray-300">ذكر</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={editingNode.gender === "female"}
                      onChange={(e) => setEditingNode({ ...editingNode, gender: "female" })}
                      className="text-pink-600"
                    />
                    <span className="text-sm dark:text-gray-300">أنثى</span>
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-300">الاسم الأول</Label>
                  <Input
                    value={editingNode.name || ""}
                    onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                    placeholder="الاسم"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-300">اسم العائلة</Label>
                  <Input
                    value={editingNode.surname || ""}
                    onChange={(e) => setEditingNode({ ...editingNode, surname: e.target.value })}
                    placeholder="اسم العائلة"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-300">سنة الميلاد</Label>
                  <Input
                    type="number"
                    value={editingNode.birth_year || ""}
                    onChange={(e) => setEditingNode({ ...editingNode, birth_year: Number.parseInt(e.target.value) })}
                    placeholder="1970"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-300">الصورة</Label>
                  <Input
                    value={editingNode.image || ""}
                    onChange={(e) => setEditingNode({ ...editingNode, image: e.target.value })}
                    placeholder="https://static8.depositphotos.com/1009634/..."
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteNode(selectedNode.id)}
                  disabled={selectedNode.id === familyData?.id}
                >
                  حذف
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingNode(selectedNode)
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSave}>
                    حفظ
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>اختر عضواً من الشجرة للتحرير</p>
            </div>
          )}
        </div>
      </div>
      ;<input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
    </div>
  )
}
