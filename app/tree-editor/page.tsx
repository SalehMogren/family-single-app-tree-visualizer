/**
 * @file The main page component for the Family Tree Editor.
 * This component orchestrates the entire editor UI, including the header,
 * sidebar, and the main tree visualization area.
 */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTreeStore } from "../../hooks/useTreeStore";
import { TreeSvg } from "../../components/tree-editor/TreeSvg";
import { Toolbar } from "../../components/tree-editor/Toolbar";
import { AddOrEditNodeForm } from "../../components/tree-editor/AddOrEditNodeForm";
import { DebugComponent } from "../../components/tree-editor/DebugComponent";
import { TreeNodeData, FamilyMember } from "../../lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Moon, Sun, TreePine, Edit, Trash2, X, Sparkles, Focus, Maximize2 } from "lucide-react";
import { RelationshipManager } from "@/components/tree-editor/RelationshipManager";
import { DragDropProvider } from "@/components/tree-editor/DragDropProvider";
import { SuggestedRelatives } from "@/components/tree-editor/SuggestedRelatives";

// Defines the different modes for the sidebar panel.
type SidebarMode = "stats" | "view" | "edit" | "add" | "suggestions";

export default function TreeEditor() {
  // UI state for dark mode, sidebar view, and loading status.
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("stats");
  const [selectedNode, setSelectedNode] = useState<FamilyMember | null>(null);
  const [addRelativeInfo, setAddRelativeInfo] = useState<{
    targetId: string;
    type: "parent" | "spouse" | "child" | "sibling";
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use the custom hook to interact with the Redux store.
  const {
    data,
    tree,
    mainId,
    viewMode,
    focusPersonId,
    updateDataAndMainId,
    setFocusNode,
    setViewMode,
    setFocusPerson,
    addNode,
    updateNode,
    deleteNode,
    modifyRelationship,
    fixRelationshipInconsistencies,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTreeStore();

  // A ref to access methods on the TreeSvg component (e.g., for zoom).
  const treeSvgRef = useRef<any>(null);

  // Effect for loading the initial sample data.
  useEffect(() => {
    const sampleData = {
      person_1: {
        id: "person_1",
        name: "المؤسس",
        gender: "male" as const,
        birth_year: 1950,
        parents: [],
        spouses: [],
        children: [],
      },
    };
    updateDataAndMainId(sampleData, "person_1");
    setIsLoading(false);
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Effect to detect and apply the system's preferred color scheme.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Effect to apply the dark mode class to the root element.
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  /**
   * Handles clicks on a node in the tree.
   * Switches the sidebar to 'view' mode for regular nodes or 'add' mode for placeholders.
   */
  const handleNodeClick = (node: TreeNodeData) => {
    if (node.isPlaceholder) {
      if (node.targetId && node.type) {
        setAddRelativeInfo({ targetId: node.targetId, type: node.type });
        setSidebarMode("add");
        setSelectedNode(null);
      }
    } else {
      setSelectedNode(data[node.id]);
      setFocusNode(node.id);
      setSidebarMode("view");
      // Auto-show suggestions for the selected person
      setShowSuggestions(true);
    }
  };

  /**
   * Toggle between full tree view and 3-level focus view
   */
  const handleToggleViewMode = () => {
    if (viewMode === "full") {
      // Switch to focus mode with currently selected person
      if (selectedNode) {
        setFocusPerson(selectedNode.id);
      }
    } else {
      // Switch to full view
      setViewMode("full");
    }
  };

  /**
   * Focus on a specific person in 3-level view
   */
  const handleFocusOnPerson = (personId: string) => {
    setFocusPerson(personId);
    // Also select this person in the UI
    setSelectedNode(data[personId]);
    setFocusNode(personId);
    setSidebarMode("view");
  };

  /**
   * Handles clicks on the '+' buttons around a selected node.
   * Switches the sidebar to 'add' mode for the specified relative type.
   */
  const handleAddRelativeClick = (
    nodeId: string,
    type: "parent" | "spouse" | "child" | "sibling"
  ) => {
    setAddRelativeInfo({ targetId: nodeId, type });
    setSidebarMode("add");
    setSelectedNode(null);
  };

  /**
   * Saves data from the AddOrEditNodeForm.
   * Dispatches either an 'updateNode' or 'addNode' action.
   */
  const handleSaveNode = (formData: Partial<FamilyMember>) => {
    if (sidebarMode === "edit" && selectedNode) {
      updateNode({ ...selectedNode, ...formData } as FamilyMember);
    } else if (sidebarMode === "add" && addRelativeInfo) {
      addNode(addRelativeInfo.targetId, addRelativeInfo.type, formData);
    }
    // Reset the sidebar to its default state.
    setSidebarMode("stats");
    setSelectedNode(null);
    setAddRelativeInfo(null);
  };

  /**
   * Deletes the currently selected node from the tree.
   */
  const handleDeleteNode = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      setSidebarMode("stats");
      setSelectedNode(null);
    }
  };

  /**
   * Cancels the add/edit operation and returns the sidebar to the previous view.
   */
  const handleCancel = () => {
    setSidebarMode(selectedNode ? "view" : "stats");
    setAddRelativeInfo(null);
  };

  /**
   * Handles relationship modifications (connect, disconnect, modify)
   */
  const handleModifyRelationship = (
    personId1: string,
    personId2: string,
    action: "connect" | "disconnect" | "modify",
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => {
    modifyRelationship(personId1, personId2, action, relationshipType);
  };

  /**
   * Wrapper for drag/drop relationship operations
   */
  const handleRelationshipDrop = (
    sourceId: string,
    targetId: string,
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => {
    handleModifyRelationship(sourceId, targetId, "connect", relationshipType);
  };

  /**
   * Handle connecting existing people from suggestions
   */
  const handleConnectExisting = (
    personId1: string,
    personId2: string,
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => {
    handleModifyRelationship(personId1, personId2, "connect", relationshipType);
  };

  /**
   * Toggle suggestions panel
   */
  const handleToggleSuggestions = () => {
    if (selectedNode) {
      setShowSuggestions(!showSuggestions);
      if (!showSuggestions) {
        setSidebarMode("suggestions");
      } else {
        setSidebarMode("view");
      }
    }
  };

  /**
   * Triggers a browser download of the current tree data as a JSON file.
   */
  const handleSaveToFile = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Opens a file dialog to load tree data from a local JSON file.
   */
  const handleLoadFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const loadedData = JSON.parse(ev.target?.result as string);
            const firstPersonId = Object.keys(loadedData)[0] || "";
            if (firstPersonId) {
              updateDataAndMainId(loadedData, firstPersonId);
            }
          } catch (error) {
            console.error("Failed to parse JSON file.", error);
            alert("Error loading file.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Handlers to call zoom/reset methods on the TreeSvg component.
  const handleResetView = () => treeSvgRef.current?.onResetView();
  const handleZoomIn = () => treeSvgRef.current?.onZoomIn();
  const handleZoomOut = () => treeSvgRef.current?.onZoomOut();

  // Display a loading indicator while the initial data is being fetched.
  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}>
        <TreePine
          className={`w-12 h-12 mx-auto mb-4 animate-pulse ${
            isDarkMode ? "text-green-400" : "text-green-600"
          }`}
        />
      </div>
    );
  }

  // Render the main editor layout.
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
      {/* Header Section */}
      <header
        className={`border-b transition-colors duration-300 ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}>
        <div className='container mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <TreePine
                className={`w-8 h-8 ${
                  isDarkMode ? "text-green-400" : "text-green-600"
                }`}
              />
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                محرر شجرة العائلة
              </h1>
            </div>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? (
                <Sun className='w-5 h-5' />
              ) : (
                <Moon className='w-5 h-5' />
              )}
            </Button>
          </div>
        </div>
      </header>
      {/* Main Content Area */}
      <div
        className={`grid h-[calc(100vh-80px)] ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
        style={{ gridTemplateColumns: "384px 1fr 384px" }}>
        {/* Right Sidebar (was Left) - For Node Info */}
        <aside
          className={`border-r overflow-y-auto transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}>
          <div className='p-4 space-y-4'>
            {/* Conditional rendering for the right sidebar panel */}
            {sidebarMode === "add" && addRelativeInfo ? (
              <AddOrEditNodeForm
                onSave={handleSaveNode}
                onCancel={handleCancel}
                isDarkMode={isDarkMode}
                relationType={addRelativeInfo.type}
              />
            ) : sidebarMode === "edit" && selectedNode ? (
              <AddOrEditNodeForm
                nodeToEdit={selectedNode}
                onSave={handleSaveNode}
                onCancel={handleCancel}
                isDarkMode={isDarkMode}
              />
            ) : sidebarMode === "suggestions" && selectedNode ? (
              <SuggestedRelatives
                selectedPerson={selectedNode}
                allData={data}
                onAddRelative={handleAddRelativeClick}
                onConnectExisting={handleConnectExisting}
                isDarkMode={isDarkMode}
                onClose={() => {
                  setShowSuggestions(false);
                  setSidebarMode("view");
                }}
              />
            ) : sidebarMode === "view" && selectedNode ? (
              <div className='space-y-4'>
                <Card
                  className={`p-4 ${
                    isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50"
                  }`}>
                  <div className='flex items-center justify-between mb-3'>
                    <h3
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                      معلومات العضو
                    </h3>
                    <div className='flex items-center space-x-2'>
                      <Button 
                        variant='ghost' 
                        size='sm' 
                        onClick={handleToggleViewMode}
                        className={`${viewMode === 'focus' ? 'text-blue-500 hover:text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}
                        title={viewMode === 'focus' ? 'Switch to Full View' : 'Focus on This Person (3-Level View)'}
                      >
                        {viewMode === 'focus' ? <Maximize2 className='w-4 h-4' /> : <Focus className='w-4 h-4' />}
                      </Button>
                      <Button 
                        variant='ghost' 
                        size='sm' 
                        onClick={handleToggleSuggestions}
                        className='text-yellow-500 hover:text-yellow-600'
                        title='Smart Suggestions'
                      >
                        <Sparkles className='w-4 h-4' />
                      </Button>
                      <Button variant='ghost' size='sm' onClick={handleCancel}>
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='space-y-3'>
                    <p>
                      <Label>الاسم:</Label> {selectedNode.name}
                    </p>
                    <p>
                      <Label>الجنس:</Label>{" "}
                      {selectedNode.gender === "male" ? "ذكر" : "أنثى"}
                    </p>
                    <p>
                      <Label>الميلاد:</Label> {selectedNode.birth_year}
                    </p>
                    {selectedNode.death_year && (
                      <p>
                        <Label>الوفاة:</Label> {selectedNode.death_year}
                      </p>
                    )}
                    <div className='flex gap-2 pt-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='flex-1'
                        onClick={() => setSidebarMode("edit")}>
                        <Edit className='w-3 h-3 mr-1' />
                        تحرير
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='flex-1'
                        onClick={handleDeleteNode}>
                        <Trash2 className='w-3 h-3 mr-1' />
                        حذف
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Suggestions Quick Preview */}
                {showSuggestions && (
                  <SuggestedRelatives
                    selectedPerson={selectedNode}
                    allData={data}
                    onAddRelative={handleAddRelativeClick}
                    onConnectExisting={handleConnectExisting}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowSuggestions(false)}
                  />
                )}

                {/* Relationship Manager */}
                <RelationshipManager
                  selectedPerson={selectedNode}
                  allData={data}
                  onAddRelative={handleAddRelativeClick}
                  onModifyRelationship={handleModifyRelationship}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              <div className='flex items-center justify-center h-full text-center'>
                <p className='text-gray-500'>
                  حدد عضوًا من الشجرة لعرض التفاصيل أو لإضافه قريب له
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Tree Visualization */}
        <main className='relative bg-gray-100 dark:bg-gray-950'>
          {tree.length > 0 ? (
            <DragDropProvider onRelationshipDrop={handleRelationshipDrop}>
              <TreeSvg
                ref={treeSvgRef}
                isDarkMode={isDarkMode}
                onNodeClick={handleNodeClick}
                onAddRelative={handleAddRelativeClick}
                onRelationshipDrop={handleRelationshipDrop}
                onModifyRelationship={handleModifyRelationship}
                selectedNodeId={selectedNode?.id}
                className='w-full h-full'
              />
            </DragDropProvider>
          ) : (
            <div className='flex items-center justify-center h-full'>
              <div
                className={`text-lg ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                لا توجد بيانات لعرضها. ابدأ بإضافة شخص.
              </div>
            </div>
          )}
        </main>

        {/* Left Sidebar (was Right) - For Controls */}
        <aside
          className={`border-l overflow-y-auto transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}>
          <div className='p-4 space-y-4'>
            {/* Toolbar for file, history, and view controls */}
            <Toolbar
              isDarkMode={isDarkMode}
              onSave={handleSaveToFile}
              onLoad={handleLoadFromFile}
              onExport={handleSaveToFile} // Note: Using save function for export
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetView={handleResetView}
            />
            {/* Tree Statistics */}
            <Card
              className={`p-4 ${
                isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50"
              }`}>
              <h3
                className={`font-semibold mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                إحصائيات الشجرة
              </h3>
              <div className='text-center space-y-3'>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}>
                    {tree.length}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    العقد المعروضة
                  </div>
                </div>
                <div>
                  <div
                    className={`text-lg font-medium ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}>
                    {Object.keys(data).length}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    إجمالي الأعضاء
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className={`flex items-center justify-center space-x-1 text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {viewMode === 'focus' ? <Focus className='w-3 h-3' /> : <Maximize2 className='w-3 h-3' />}
                    <span>{viewMode === 'focus' ? 'عرض مركز (3 مستويات)' : 'عرض كامل'}</span>
                  </div>
                  {viewMode === 'focus' && focusPersonId && (
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}>
                      التركيز على: {data[focusPersonId]?.name || 'غير محدد'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
      <DebugComponent />
    </div>
  );
}
