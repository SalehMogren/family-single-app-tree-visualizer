import React, { useEffect } from "react";
import { useTreeStore } from "../../hooks/useTreeStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Undo,
  Redo,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Save,
  Upload,
  Download,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";

interface ToolbarProps {
  isDarkMode: boolean;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}

export function Toolbar({
  isDarkMode = false,
  onSave,
  onLoad,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onResetView,
  className = "",
}: ToolbarProps) {
  const {
    nodeSeparation,
    levelSeparation,
    setNodeSeparation,
    setLevelSeparation,
    focusNodeId,
    setFocusNode,
  } = useTreeStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            if (e.shiftKey) {
              if (canRedo) {
                e.preventDefault();
                onRedo();
              }
            } else {
              if (canUndo) {
                e.preventDefault();
                onUndo();
              }
            }
            break;
          case "y":
            if (canRedo) {
              e.preventDefault();
              onRedo();
            }
            break;
          case "s":
            e.preventDefault();
            onSave?.();
            break;
          case "o":
            e.preventDefault();
            onLoad?.();
            break;
          case "e":
            e.preventDefault();
            onExport?.();
            break;
        }
      }

      // ESC to clear focus
      if (e.key === "Escape") {
        setFocusNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    setFocusNode,
    onSave,
    onLoad,
    onExport,
  ]);

  return (
    <Card
      className={`
      p-4 space-y-4
      ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
      ${className}
    `}>
      {/* History Controls */}
      <div className='space-y-2'>
        <Label
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
          التحكم
        </Label>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onUndo}
            disabled={!canUndo}
            title='تراجع (Ctrl+Z)'>
            <Undo className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onRedo}
            disabled={!canRedo}
            title='إعادة (Ctrl+Shift+Z)'>
            <Redo className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setFocusNode(null)}
            disabled={!focusNodeId}
            title='إلغاء التركيز (Esc)'>
            {focusNodeId ? (
              <EyeOff className='w-4 h-4' />
            ) : (
              <Eye className='w-4 h-4' />
            )}
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <div className='space-y-2'>
        <Label
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
          العرض
        </Label>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={onZoomIn} title='تكبير'>
            <ZoomIn className='w-4 h-4' />
          </Button>
          <Button variant='outline' size='sm' onClick={onZoomOut} title='تصغير'>
            <ZoomOut className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onResetView}
            title='إعادة تعيين العرض'>
            <RotateCcw className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Layout Controls */}
      <div className='space-y-3'>
        <Label
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
          تخطيط الشجرة
        </Label>

        <div className='space-y-2'>
          <Label
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            المسافة الأفقية: {nodeSeparation}px
          </Label>
          <Slider
            value={[nodeSeparation]}
            onValueChange={(value) => setNodeSeparation(value[0])}
            min={100}
            max={400}
            step={20}
            className='w-full'
          />
        </div>

        <div className='space-y-2'>
          <Label
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            المسافة العمودية: {levelSeparation}px
          </Label>
          <Slider
            value={[levelSeparation]}
            onValueChange={(value) => setLevelSeparation(value[0])}
            min={80}
            max={300}
            step={20}
            className='w-full'
          />
        </div>
      </div>

      {/* File Operations */}
      <div className='space-y-2'>
        <Label
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
          الملف
        </Label>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onSave}
            title='حفظ (Ctrl+S)'>
            <Save className='w-4 h-4 mr-1' />
            حفظ
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onLoad}
            title='تحميل (Ctrl+O)'>
            <Upload className='w-4 h-4 mr-1' />
            تحميل
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onExport}
            title='تصدير (Ctrl+E)'
            className='col-span-2'>
            <Download className='w-4 h-4 mr-1' />
            تصدير
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        className={`
        p-3 rounded-md text-center
        ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}
      `}>
        <div
          className={`text-xs ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
          {canUndo ? `${canUndo ? "يمكن التراجع" : ""}` : "لا يمكن التراجع"}
          {canUndo && canRedo && " • "}
          {canRedo ? "يمكن الإعادة" : ""}
        </div>
      </div>
    </Card>
  );
}
