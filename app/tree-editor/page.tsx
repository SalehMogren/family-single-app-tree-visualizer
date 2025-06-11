"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Download, Upload, ArrowLeft, Settings, User, Users, Moon, Sun, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import * as d3 from "d3"

interface FamilyMember {
  id: string
  name: string
  gender: "male" | "female"
  birth_year: number
  death_year?: number
  parents?: string[] // Array of parent IDs
  spouses?: string[] // Array of spouse IDs
  children?: string[] // Array of children IDs
  occupation?: string
  birthplace?: string
  notes?: string
  image?: string
  x?: number
  y?: number
}

interface FamilyTree {
  members: { [id: string]: FamilyMember }
  rootId: string
}

interface PlaceholderNode {
  id: string
  type: "parent" | "spouse" | "child"
  targetId: string
  isPlaceholder: true
  gender?: "male" | "female"
  name: string
  x?: number
  y?: number
}

interface TreeNodeData {
  id: string
  name: string
  gender: "male" | "female"
  birth_year: number
  death_year?: number
  isPlaceholder?: boolean
  type?: "parent" | "spouse" | "child"
  targetId?: string
  image?: string
  level: number
  generation: number
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

  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null)
  const [selectedNode, setSelectedNode] = useState<FamilyMember | null>(null)
  const [editingNode, setEditingNode] = useState<Partial<FamilyMember>>({})
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Panel settings
  const [detailSettings, setDetailSettings] = useState<DetailPanelSettings>({
    enableDetailView: true,
    viewOnly: false,
    editOnClick: true,
  })

  const [fields, setFields] = useState<FieldConfig[]>(defaultFields)

  // Initialize with sample data
  useEffect(() => {
    const rootMember: FamilyMember = {
      id: "root",
      name: "أحمد محمد",
      gender: "male",
      birth_year: 1970,
      parents: [],
      spouses: [],
      children: [],
    }

    const sampleTree: FamilyTree = {
      members: {
        root: rootMember,
      },
      rootId: "root",
    }

    setFamilyTree(sampleTree)
    setSelectedNode(rootMember)
    setEditingNode(rootMember)
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

  const addRelative = (
    targetId: string,
    newMember: Omit<FamilyMember, "id">,
    relationType: "parent" | "spouse" | "child",
  ) => {
    if (!familyTree) return

    const newId = generateId()
    const newMemberWithId: FamilyMember = {
      ...newMember,
      id: newId,
      parents: newMember.parents || [],
      spouses: newMember.spouses || [],
      children: newMember.children || [],
    }

    const updatedMembers = { ...familyTree.members }
    const targetMember = updatedMembers[targetId]

    if (!targetMember) return

    // Add the new member
    updatedMembers[newId] = newMemberWithId

    // Update relationships
    if (relationType === "parent") {
      // Add parent to target's parents
      if (!targetMember.parents) targetMember.parents = []
      targetMember.parents.push(newId)

      // Add target to parent's children
      if (!newMemberWithId.children) newMemberWithId.children = []
      newMemberWithId.children.push(targetId)
    } else if (relationType === "spouse") {
      // Add spouse relationship (bidirectional)
      if (!targetMember.spouses) targetMember.spouses = []
      targetMember.spouses.push(newId)

      if (!newMemberWithId.spouses) newMemberWithId.spouses = []
      newMemberWithId.spouses.push(targetId)
    } else if (relationType === "child") {
      // Add child to target's children
      if (!targetMember.children) targetMember.children = []
      targetMember.children.push(newId)

      // Add target to child's parents
      if (!newMemberWithId.parents) newMemberWithId.parents = []
      newMemberWithId.parents.push(targetId)
    }

    setFamilyTree({
      ...familyTree,
      members: updatedMembers,
    })
  }

  const deleteNode = (nodeId: string) => {
    if (!familyTree || nodeId === familyTree.rootId) return

    const updatedMembers = { ...familyTree.members }
    const nodeToDelete = updatedMembers[nodeId]

    if (!nodeToDelete) return

    // Remove relationships
    Object.values(updatedMembers).forEach((member) => {
      if (member.parents) {
        member.parents = member.parents.filter((id) => id !== nodeId)
      }
      if (member.spouses) {
        member.spouses = member.spouses.filter((id) => id !== nodeId)
      }
      if (member.children) {
        member.children = member.children.filter((id) => id !== nodeId)
      }
    })

    // Delete the node
    delete updatedMembers[nodeId]

    setFamilyTree({
      ...familyTree,
      members: updatedMembers,
    })

    setSelectedNode(null)
    setEditingNode({})
  }

  const handleSave = () => {
    if (!familyTree || !selectedNode || !editingNode.name) return

    const updatedMembers = { ...familyTree.members }
    updatedMembers[selectedNode.id] = {
      ...selectedNode,
      ...editingNode,
      birth_year: editingNode.birth_year || selectedNode.birth_year,
    }

    setFamilyTree({
      ...familyTree,
      members: updatedMembers,
    })

    setSelectedNode(updatedMembers[selectedNode.id])
  }

  const exportData = () => {
    if (!familyTree) return

    const dataStr = JSON.stringify(familyTree, null, 2)
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
        setFamilyTree(data)
        setSelectedNode(data.members[data.rootId])
        setEditingNode(data.members[data.rootId])
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
    if (svgRef.current && zoomRef.current && familyTree) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity.translate(400, 300).scale(1))
    }
  }

  // Create layout with proper positioning
  const createFamilyLayout = (tree: FamilyTree): TreeNodeData[] => {
    const nodes: TreeNodeData[] = []
    const visited = new Set<string>()
    const positions = new Map<string, { x: number; y: number; generation: number }>()

    // Calculate generations
    const calculateGeneration = (memberId: string, generation = 0): number => {
      const member = tree.members[memberId]
      if (!member || visited.has(memberId)) return generation

      visited.add(memberId)
      let maxGeneration = generation

      // Check children for deeper generations
      if (member.children) {
        member.children.forEach((childId) => {
          const childGeneration = calculateGeneration(childId, generation + 1)
          maxGeneration = Math.max(maxGeneration, childGeneration)
        })
      }

      return maxGeneration
    }

    // Start from root and assign positions
    const assignPositions = (memberId: string, x = 400, y = 300, generation = 0) => {
      if (positions.has(memberId)) return

      const member = tree.members[memberId]
      if (!member) return

      positions.set(memberId, { x, y, generation })

      // Add to nodes array
      nodes.push({
        id: member.id,
        name: member.name,
        gender: member.gender,
        birth_year: member.birth_year,
        death_year: member.death_year,
        image: member.image,
        level: 0,
        generation,
      })

      // Position parents above
      if (member.parents && member.parents.length > 0) {
        member.parents.forEach((parentId, index) => {
          const parentX = x + (index - 0.5) * 200
          const parentY = y - 150
          assignPositions(parentId, parentX, parentY, generation - 1)
        })
      }

      // Position spouses to the side
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach((spouseId, index) => {
          const spouseX = x + 250 + index * 200
          const spouseY = y
          assignPositions(spouseId, spouseX, spouseY, generation)
        })
      }

      // Position children below
      if (member.children && member.children.length > 0) {
        const childrenWidth = (member.children.length - 1) * 200
        const startX = x - childrenWidth / 2

        member.children.forEach((childId, index) => {
          const childX = startX + index * 200
          const childY = y + 150
          assignPositions(childId, childX, childY, generation + 1)
        })
      }
    }

    // Start layout from root
    assignPositions(tree.rootId)

    // Add placeholders for missing relationships
    Object.values(tree.members).forEach((member) => {
      const pos = positions.get(member.id)
      if (!pos) return

      // Add parent placeholders
      if (!member.parents || member.parents.length < 2) {
        const existingParents = member.parents?.length || 0
        for (let i = existingParents; i < 2; i++) {
          nodes.push({
            id: `${member.id}-parent-${i}-placeholder`,
            name: i === 0 ? "إضافة والد" : "إضافة والدة",
            gender: i === 0 ? "male" : "female",
            birth_year: member.birth_year - 30,
            isPlaceholder: true,
            type: "parent",
            targetId: member.id,
            level: 0,
            generation: pos.generation - 1,
          })
        }
      }

      // Add spouse placeholder
      nodes.push({
        id: `${member.id}-spouse-placeholder`,
        name: member.gender === "male" ? "إضافة زوجة" : "إضافة زوج",
        gender: member.gender === "male" ? "female" : "male",
        birth_year: member.birth_year,
        isPlaceholder: true,
        type: "spouse",
        targetId: member.id,
        level: 0,
        generation: pos.generation,
      })

      // Add child placeholder
      nodes.push({
        id: `${member.id}-child-placeholder`,
        name: "إضافة طفل",
        gender: "male",
        birth_year: member.birth_year + 25,
        isPlaceholder: true,
        type: "child",
        targetId: member.id,
        level: 0,
        generation: pos.generation + 1,
      })
    })

    return nodes
  }

  const handlePlaceholderClick = (placeholderNode: TreeNodeData) => {
    if (!placeholderNode.isPlaceholder || !placeholderNode.type || !placeholderNode.targetId) return

    const newMember: Omit<FamilyMember, "id"> = {
      name:
        placeholderNode.type === "parent"
          ? placeholderNode.gender === "male"
            ? "الوالد"
            : "الوالدة"
          : placeholderNode.type === "spouse"
            ? placeholderNode.gender === "male"
              ? "الزوج"
              : "الزوجة"
            : "الطفل",
      gender: placeholderNode.gender || "male",
      birth_year: placeholderNode.birth_year,
      parents: [],
      spouses: [],
      children: [],
    }

    addRelative(placeholderNode.targetId, newMember, placeholderNode.type)
  }

  // Render tree visualization
  useEffect(() => {
    if (!familyTree || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 800
    const height = 600

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

    // Create layout
    const layoutNodes = createFamilyLayout(familyTree)

    // Create connections
    const connections: Array<{ source: TreeNodeData; target: TreeNodeData; type: string }> = []

    Object.values(familyTree.members).forEach((member) => {
      const memberNode = layoutNodes.find((n) => n.id === member.id)
      if (!memberNode) return

      // Parent connections
      if (member.parents) {
        member.parents.forEach((parentId) => {
          const parentNode = layoutNodes.find((n) => n.id === parentId)
          if (parentNode) {
            connections.push({
              source: parentNode,
              target: memberNode,
              type: "parent-child",
            })
          }
        })
      }

      // Spouse connections
      if (member.spouses) {
        member.spouses.forEach((spouseId) => {
          const spouseNode = layoutNodes.find((n) => n.id === spouseId)
          if (spouseNode && member.id < spouseId) {
            // Avoid duplicate spouse connections
            connections.push({
              source: memberNode,
              target: spouseNode,
              type: "spouse",
            })
          }
        })
      }
    })

    // Draw connections
    const links = container
      .selectAll(".link")
      .data(connections)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d) => {
        const sourceX = d.source.id.includes("placeholder") ? 0 : 400 // Placeholder positioning
        const sourceY = d.source.id.includes("placeholder") ? 0 : 300
        const targetX = d.target.id.includes("placeholder") ? 0 : 400
        const targetY = d.target.id.includes("placeholder") ? 0 : 300

        if (d.type === "spouse") {
          return `M${sourceX},${sourceY} L${targetX},${targetY}`
        } else {
          const midY = sourceY + (targetY - sourceY) / 2
          return `M${sourceX},${sourceY} L${sourceX},${midY} L${targetX},${midY} L${targetX},${targetY}`
        }
      })
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.source.isPlaceholder || d.target.isPlaceholder) return "#9CA3AF"
        return d.type === "spouse" ? "#F59E0B" : "#D4AF37"
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => {
        return d.source.isPlaceholder || d.target.isPlaceholder ? "5,5" : "none"
      })
      .attr("opacity", (d) => {
        return d.source.isPlaceholder || d.target.isPlaceholder ? 0.5 : 0.7
      })

    // Create nodes
    const nodes = container
      .selectAll(".node")
      .data(layoutNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", "translate(400,300)") // Center initially
      .style("cursor", "pointer")

    // Only make real nodes draggable
    nodes
      .filter((d: any) => !d.isPlaceholder)
      .call(
        d3
          .drag<SVGGElement, TreeNodeData>()
          .on("start", function (event, d) {
            d3.select(this).raise()
          })
          .on("drag", function (event, d) {
            d3.select(this).attr("transform", `translate(${event.x},${event.y})`)
          })
          .on("end", (event, d) => {
            const member = familyTree.members[d.id]
            if (member) {
              setSelectedNode(member)
              setEditingNode(member)
            }
          }),
      )

    // Add node backgrounds
    nodes
      .append("rect")
      .attr("x", -80)
      .attr("y", -35)
      .attr("width", 160)
      .attr("height", 70)
      .attr("rx", 8)
      .attr("fill", (d) => {
        if (d.isPlaceholder) return "none"
        if (selectedNode && d.id === selectedNode.id) return "#FCD34D"
        return d.gender === "male" ? "#1E40AF" : "#BE185D"
      })
      .attr("stroke", (d) => {
        if (d.isPlaceholder) {
          return d.gender === "male" ? "#1E40AF" : "#BE185D"
        }
        return "#D4AF37"
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.isPlaceholder ? "5,5" : "none"))
      .attr("opacity", (d) => (d.isPlaceholder ? 0.6 : 1))
      .on("click", (event, d) => {
        event.stopPropagation()
        if (d.isPlaceholder) {
          handlePlaceholderClick(d)
        } else {
          const member = familyTree.members[d.id]
          if (member) {
            setSelectedNode(member)
            setEditingNode(member)
          }
        }
      })

    // Add plus icon for placeholder nodes
    nodes
      .filter((d) => d.isPlaceholder)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("fill", (d) => (d.gender === "male" ? "#1E40AF" : "#BE185D"))
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .text("+")

    // Add images if available (only for real nodes)
    nodes
      .filter((d) => !d.isPlaceholder && d.image)
      .append("image")
      .attr("x", -70)
      .attr("y", -25)
      .attr("width", 30)
      .attr("height", 30)
      .attr("href", (d) => d.image!)
      .attr("clip-path", "circle(15px)")

    // Add names
    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.isPlaceholder ? 25 : -10))
      .attr("fill", (d) => {
        if (d.isPlaceholder) {
          return d.gender === "male" ? "#1E40AF" : "#BE185D"
        }
        return "white"
      })
      .attr("font-size", (d) => (d.isPlaceholder ? "12px" : "14px"))
      .attr("font-weight", (d) => (d.isPlaceholder ? "normal" : "bold"))
      .text((d) => d.name)

    // Add birth year (only for real nodes)
    nodes
      .filter((d) => !d.isPlaceholder)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 10)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text((d) => d.birth_year.toString())
  }, [familyTree, selectedNode])

  if (!familyTree) {
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

          {/* Legend */}
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-dashed rounded"></div>
                <span className="text-sm dark:text-gray-300">عضو جديد</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-amber-500"></div>
                <span className="text-sm dark:text-gray-300">رابط عائلي</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-orange-500"></div>
                <span className="text-sm dark:text-gray-300">رابط زواج</span>
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

          {/* Family Statistics */}
          <div className="space-y-4">
            <h3 className="font-semibold dark:text-white">إحصائيات العائلة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Object.keys(familyTree.members).length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">إجمالي الأعضاء</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Object.values(familyTree.members).filter((m) => m.children && m.children.length > 0).length}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">الآباء</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Tree View */}
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

              {/* Instructions */}
              <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded text-xs max-w-xs">
                <p className="font-semibold mb-1">التعليمات:</p>
                <p>• انقر على العقد المنقطة لإضافة أعضاء جدد</p>
                <p>• اسحب العقد الموجودة لإعادة ترتيبها</p>
                <p>• انقر على عضو لتحريره في اللوحة اليمنى</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Panel - Node Editor */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 pt-20 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 dark:text-gray-300" />
              <span className="text-lg font-bold dark:text-white">محرر العضو</span>
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
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Family Relationships Display */}
              <div className="space-y-3">
                <h4 className="font-semibold dark:text-white">العلاقات العائلية</h4>

                {selectedNode.parents && selectedNode.parents.length > 0 && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-xs text-blue-600 dark:text-blue-400">الوالدان:</span>
                    {selectedNode.parents.map((parentId) => {
                      const parent = familyTree.members[parentId]
                      return parent ? (
                        <p key={parentId} className="text-sm dark:text-gray-300">
                          {parent.name}
                        </p>
                      ) : null
                    })}
                  </div>
                )}

                {selectedNode.spouses && selectedNode.spouses.length > 0 && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">الأزواج:</span>
                    {selectedNode.spouses.map((spouseId) => {
                      const spouse = familyTree.members[spouseId]
                      return spouse ? (
                        <p key={spouseId} className="text-sm dark:text-gray-300">
                          {spouse.name}
                        </p>
                      ) : null
                    })}
                  </div>
                )}

                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-xs text-green-600 dark:text-green-400">الأطفال:</span>
                    {selectedNode.children.map((childId) => {
                      const child = familyTree.members[childId]
                      return child ? (
                        <p key={childId} className="text-sm dark:text-gray-300">
                          {child.name}
                        </p>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteNode(selectedNode.id)}
                  disabled={selectedNode.id === familyTree?.rootId}
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
              <p className="text-xs mt-2">أو انقر على العقد المنقطة لإضافة أعضاء جدد</p>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
    </div>
  )
}
