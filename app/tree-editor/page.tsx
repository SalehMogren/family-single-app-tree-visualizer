"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Upload,
  ArrowLeft,
  Settings,
  User,
  Users,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTreeStore } from "./store/useTreeStore";
import { calculateTree } from "./utils/CalculateTree";
import { useLinks } from "./hooks/useLinks";
import { TreeSvg } from "./components/TreeSvg";
import { DetailPanelSettings, FieldConfig, TreeNodeData } from "./types";
import { toggleRels } from "./handlers/toggleRels";
import { newPerson } from "./handlers/newPerson";

const defaultFields: FieldConfig[] = [
  {
    id: "name",
    name: "Name",
    type: "text",
    required: true,
    editable: true,
  },
  {
    id: "birth_year",
    name: "Birthday",
    type: "number",
    required: true,
    editable: true,
  },
  {
    id: "image",
    name: "Avatar",
    type: "image",
    required: false,
    editable: true,
  },
];

export default function TreeEditor() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: familyTree,
    tree,
    mainId,
    focusNodeId,
    nodeSeparation,
    levelSeparation,
    updateData,
    updateMainId,
    recalculateTree,
    toggleAllRels,
    undo,
    redo,
    setFocusNode,
    loadInitialData,
  } = useTreeStore();

  useEffect(() => {
    if (!familyTree) {
      loadInitialData();
    } else {
      recalculateTree();
    }
  }, [familyTree, loadInitialData, recalculateTree]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [editingNode, setEditingNode] = useState<Partial<TreeNodeData>>({});

  // Panel settings
  const [detailSettings, setDetailSettings] = useState<DetailPanelSettings>({
    enableDetailView: true,
    viewOnly: false,
    editOnClick: true,
  });

  // Toggle dark mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Handle node click
  const handleNodeClick = (node: TreeNodeData) => {
    if (node.isPlaceholder) {
      setSelectedNode(node);
      setIsAddingNewMember(true);
      setEditingNode({
        gender: node.gender,
        birth_year: node.birth_year,
      });
    } else {
      setSelectedNode(node);
      setEditingNode(node);
      setIsAddingNewMember(false);
    }
  };

  // Handle node drag
  const handleNodeDrag = (node: TreeNodeData, x: number, y: number) => {
    if (!familyTree) return;

    const updatedMembers = { ...familyTree.members };
    const member = updatedMembers[node.id];
    if (member) {
      member.x = x;
      member.y = y;
      updateData({
        ...familyTree,
        members: updatedMembers,
      });
    }
  };

  // Handle form submission
  const handleSubmitForm = () => {
    if (!familyTree || !editingNode.name) return;

    if (isAddingNewMember && selectedNode) {
      const newMemberData = {
        name: editingNode.name,
        gender: editingNode.gender || "male",
        birth_year: editingNode.birth_year || 0,
        type: selectedNode.type || "spouse",
        targetId: selectedNode.targetId || "",
      };

      const updatedTree = newPerson({
        tree: familyTree,
        data: newMemberData,
      });

      updateData(updatedTree);
    } else if (selectedNode) {
      const updatedMembers = { ...familyTree.members };
      updatedMembers[selectedNode.id] = {
        ...selectedNode,
        ...editingNode,
        parents: selectedNode.parents?.map((p) => p.id) || [],
        children: selectedNode.children?.map((c) => c.id) || [],
        spouses: selectedNode.spouses?.map((s) => s.id) || [],
      };

      updateData({
        ...familyTree,
        members: updatedMembers,
      });
    }

    setSelectedNode(null);
    setEditingNode({});
    setIsAddingNewMember(false);
  };

  // Export data
  const exportData = () => {
    if (!familyTree) return;

    const dataStr = JSON.stringify(familyTree, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `family-tree-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import data
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        updateData(data);
        setSelectedNode(data.members[data.rootId]);
        setEditingNode(data.members[data.rootId]);
      } catch (error) {
        alert("Error reading file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Calculate tree layout
  const treeNodes = tree || [];

  // Generate links
  const links = useLinks({
    nodes: treeNodes,
    showPlaceholders,
  });

  if (!familyTree) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${
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
            }`}>
            Loading tree editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "dark" : ""
      } bg-gray-50 dark:bg-gray-900 flex`}
      dir='rtl'>
      {/* Header */}
      <div className='fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              onClick={() => router.push("/")}
              className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Home
            </Button>
            <h1 className='text-2xl font-bold dark:text-white'>
              Family Tree Editor
            </h1>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={toggleTheme}
              className='flex items-center gap-2'>
              {isDarkMode ? (
                <Sun className='h-4 w-4' />
              ) : (
                <Moon className='h-4 w-4' />
              )}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className='flex items-center gap-2'>
              {showPlaceholders ? (
                <Users className='h-4 w-4' />
              ) : (
                <User className='h-4 w-4' />
              )}
              {showPlaceholders ? "Hide Placeholders" : "Show Placeholders"}
            </Button>
            <Button
              variant='outline'
              onClick={() => fileInputRef.current?.click()}
              className='flex items-center gap-2'>
              <Upload className='h-4 w-4' />
              Import
            </Button>
            <Button onClick={exportData} className='flex items-center gap-2'>
              <Download className='h-4 w-4' />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Left Panel - Detail Panel */}
      <div className='w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-20 overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-lg font-bold dark:text-white'>
              {selectedNode
                ? isAddingNewMember
                  ? "Add Member"
                  : "Edit Member"
                : "Member Details"}
            </h2>
          </div>

          {/* Legend */}
          <div className='mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
            <h3 className='font-semibold mb-3 dark:text-white'>Legend</h3>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 bg-blue-600 rounded'></div>
                <span className='text-sm dark:text-gray-300'>Male</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 bg-pink-600 rounded'></div>
                <span className='text-sm dark:text-gray-300'>Female</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 border-2 border-gray-400 border-dashed rounded'></div>
                <span className='text-sm dark:text-gray-300'>New Member</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-1 bg-amber-500'></div>
                <span className='text-sm dark:text-gray-300'>Family Link</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-1 bg-orange-500'></div>
                <span className='text-sm dark:text-gray-300'>
                  Marriage Link
                </span>
              </div>
            </div>
          </div>

          {/* Panel Settings */}
          <div className='space-y-4 mb-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                <span className='text-sm dark:text-gray-300'>
                  Enable Detail View
                </span>
              </div>
              <Switch
                checked={detailSettings.enableDetailView}
                onCheckedChange={(checked) =>
                  setDetailSettings((prev) => ({
                    ...prev,
                    enableDetailView: checked,
                  }))
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
                <span className='text-sm dark:text-gray-300'>View Only</span>
              </div>
              <Switch
                checked={detailSettings.viewOnly}
                onCheckedChange={(checked) =>
                  setDetailSettings((prev) => ({ ...prev, viewOnly: checked }))
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                <span className='text-sm dark:text-gray-300'>
                  Edit on Click
                </span>
              </div>
              <Switch
                checked={detailSettings.editOnClick}
                onCheckedChange={(checked) =>
                  setDetailSettings((prev) => ({
                    ...prev,
                    editOnClick: checked,
                  }))
                }
              />
            </div>
          </div>

          {/* Family Statistics */}
          <div className='space-y-4'>
            <h3 className='font-semibold dark:text-white'>Family Statistics</h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded'>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {Object.keys(familyTree.members).length}
                </div>
                <div className='text-xs text-blue-600 dark:text-blue-400'>
                  Total Members
                </div>
              </div>
              <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded'>
                <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                  {
                    Object.values(
                      familyTree.members as Record<
                        string,
                        { children?: string[] }
                      >
                    ).filter((m) => m.children && m.children.length > 0).length
                  }
                </div>
                <div className='text-xs text-green-600 dark:text-green-400'>
                  Parents
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Tree View */}
      <div className='flex-1 pt-20 bg-gray-50 dark:bg-gray-900'>
        <div className='h-full p-6'>
          <Card className='h-full border-2 shadow-xl dark:border-gray-700'>
            <div className='h-full relative overflow-hidden bg-gradient-to-br from-slate-50 to-amber-50 dark:from-gray-800 dark:to-gray-900'>
              <TreeSvg
                nodes={treeNodes}
                links={links}
                zoom={zoom}
                onZoomChange={setZoom}
                onNodeClick={handleNodeClick}
                onNodeDrag={handleNodeDrag}
              />

              {/* Tree Controls */}
              <div className='absolute top-4 left-4 flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='bg-white/90 dark:bg-gray-800/90'
                  onClick={() => setZoom(zoom * 1.5)}>
                  <ZoomIn className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='bg-white/90 dark:bg-gray-800/90'
                  onClick={() => setZoom(zoom / 1.5)}>
                  <ZoomOut className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='bg-white/90 dark:bg-gray-800/90'
                  onClick={() => setZoom(1)}>
                  <RotateCcw className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='bg-white/90 dark:bg-gray-800/90'>
                  <Settings className='h-4 w-4' />
                </Button>
              </div>

              {/* Zoom Info */}
              <div className='absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded text-xs'>
                Zoom: {Math.round(zoom * 100)}%
              </div>

              {/* Instructions */}
              <div className='absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded text-xs max-w-xs'>
                <p className='font-semibold mb-1'>Instructions:</p>
                <p>• Click on dotted nodes to add new members</p>
                <p>• Drag existing nodes to rearrange them</p>
                <p>• Click on a member to edit in the right panel</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Panel - Node Editor */}
      <div className='w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 pt-20 overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-2'>
              <Settings className='h-5 w-5 dark:text-gray-300' />
              <span className='text-lg font-bold dark:text-white'>
                Member Editor
              </span>
            </div>
          </div>

          {selectedNode ? (
            <div className='space-y-6'>
              {/* Gender Selection */}
              <div>
                <div className='flex items-center gap-4 mb-4'>
                  <label className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='gender'
                      value='male'
                      checked={editingNode.gender === "male"}
                      onChange={(e) =>
                        setEditingNode({ ...editingNode, gender: "male" })
                      }
                      className='text-blue-600'
                    />
                    <span className='text-sm dark:text-gray-300'>Male</span>
                  </label>
                  <label className='flex items-center gap-2'>
                    <input
                      type='radio'
                      name='gender'
                      value='female'
                      checked={editingNode.gender === "female"}
                      onChange={(e) =>
                        setEditingNode({ ...editingNode, gender: "female" })
                      }
                      className='text-pink-600'
                    />
                    <span className='text-sm dark:text-gray-300'>Female</span>
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className='space-y-4'>
                {defaultFields.map((field) => (
                  <div key={field.id}>
                    <Label className='text-sm text-gray-600 dark:text-gray-300'>
                      {field.name}
                    </Label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={
                        field.id === "name" && isAddingNewMember
                          ? ""
                          : editingNode[
                              field.id as keyof Partial<TreeNodeData>
                            ]?.toString() || ""
                      }
                      onChange={(e) => {
                        let value: string | number = e.target.value;
                        if (field.type === "number") {
                          value = parseInt(value);
                          if (isNaN(value)) value = "";
                        }
                        setEditingNode({
                          ...editingNode,
                          [field.id]: value,
                        });
                      }}
                      disabled={!field.editable || detailSettings.viewOnly}
                      className='mt-1 block w-full
                      bg-gray-100 dark:bg-gray-700
                      border border-gray-300 dark:border-gray-600
                      rounded-md shadow-sm
                      py-2 px-3
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      sm:text-sm'
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSelectedNode(null);
                    setEditingNode({});
                    setIsAddingNewMember(false);
                  }}
                  className='flex-1'>
                  Cancel
                </Button>
                <Button onClick={handleSubmitForm} className='flex-1'>
                  {isAddingNewMember ? "Add" : "Submit"}
                </Button>
              </div>
            </div>
          ) : (
            <p className='text-center text-gray-500 dark:text-gray-400'>
              Select a member to edit
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='.json'
        onChange={importData}
        className='hidden'
      />
    </div>
  );
}
