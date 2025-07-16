"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { BaseTree, BaseTreeSettings } from "./tree/BaseTree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Settings, Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import jsPDF from "jspdf";
import { useTreeStore } from "@/hooks/useTreeStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface FamilyTreeProps {
  isDarkMode: boolean;
}

export default function FamilyTree({ isDarkMode }: FamilyTreeProps) {
  // Get tree data and settings from Redux store (optimized)
  const {
    data,
    tree,
    mainId,
    showSpouses,
    horizontalSpacing,
    verticalSpacing,
    cardWidth,
    cardHeight,
    maleColor,
    femaleColor,
    linkColor,
    lineShape,
    showLabels,
    setCardWidth,
    setCardHeight,
    setHorizontalSpacing,
    setVerticalSpacing,
    setMaleColor,
    setFemaleColor,
    setLinkColor,
    setShowLabel,
    setShowSpouses,
    updateMembersAndRelationships,
    updateMainId,
    relationships,
    focusPersonId,
    setFocusPerson,
  } = useTreeStore();

  // Only local UI state that's not tree-related
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const zoomInRef = useRef<() => void>();
  const zoomOutRef = useRef<() => void>();
  const resetViewRef = useRef<() => void>();

  // Create settings object from Redux state - memoized for performance
  const settings: BaseTreeSettings = useMemo(
    () => ({
      cardWidth,
      cardHeight,
      horizontalSpacing,
      verticalSpacing,
      margin: { top: 60, right: 60, bottom: 60, left: 60 },
      maleColor,
      femaleColor,
      linkColor,
      orientation: "vertical",
      direction: "bottom-to-top",
      showLabels,
      lineShape,
      lineLength: 1.0,
      isFullScreen: false,
    }),
    [
      cardWidth,
      cardHeight,
      horizontalSpacing,
      verticalSpacing,
      maleColor,
      femaleColor,
      linkColor,
      showLabels,
      lineShape,
    ]
  );

  // Load data from JSON file into Redux store on component mount
  useEffect(() => {
    // Only load data if not already loaded
    if (Object.keys(data).length > 0 && mainId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/data/family-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        if (jsonData.members && jsonData.relationships && jsonData.mainId) {
          // Update Redux store with loaded data
          updateMembersAndRelationships({
            members: jsonData.members,
            relationships: jsonData.relationships,
          });
          updateMainId(jsonData.mainId);
          setError(null);
        } else {
          throw new Error("Invalid data format in family-data.json.");
        }
      })
      .catch((error) => {
        console.error("Failed to load family data:", error);
        setError("فشل في تحميل بيانات العائلة");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [data, mainId, updateMembersAndRelationships, updateMainId]);

  // Handlers for zoom/export - memoized for performance
  const handleZoomIn = useCallback(() => {
    zoomInRef.current && zoomInRef.current();
  }, []);

  const handleZoomOut = useCallback(() => {
    zoomOutRef.current && zoomOutRef.current();
  }, []);

  const handleResetView = useCallback(() => {
    resetViewRef.current && resetViewRef.current();
  }, []);

  // Export as PNG or PDF using SVG serialization
  const svgId = "family-tree-svg";
  const handleExport = useCallback(
    async (format: "png" | "pdf") => {
      const svg = document.getElementById(svgId);
      if (!svg) return;

      // Inline all images as data URLs
      const images = svg.querySelectorAll("image");
      const promises: Promise<void>[] = [];
      images.forEach((img: any) => {
        const href = img.getAttribute("href") || img.getAttribute("xlink:href");
        if (href && !href.startsWith("data:")) {
          promises.push(
            fetch(href)
              .then((res) => res.blob())
              .then((blob) => {
                return new Promise<void>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    img.setAttribute("href", reader.result as string);
                    resolve();
                  };
                  reader.readAsDataURL(blob);
                });
              })
              .catch(() => {})
          );
        }
      });
      await Promise.all(promises);

      // Now serialize and export as before
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svg.clientWidth;
        canvas.height = svg.clientHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = isDarkMode ? "#18181b" : "#f9fafb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        if (format === "png") {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `family-tree-${Date.now()}.png`;
          link.click();
        } else {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [canvas.width, canvas.height],
          });
          pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
          pdf.save(`family-tree-${Date.now()}.pdf`);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [isDarkMode]
  );

  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-96 ${
          isDarkMode ? "bg-gray-900" : "bg-amber-50"
        }`}>
        <div className='text-center'>
          <span
            className={`mx-auto h-12 w-12 mb-4 animate-pulse ${
              isDarkMode ? "text-amber-400" : "text-amber-600"
            }`}>
            ⏳
          </span>
          <p
            className={`text-lg font-semibold ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
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
          <span className='mx-auto h-12 w-12 text-red-600 mb-4'>❌</span>
          <p className='text-lg font-semibold text-red-700'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section
      id='family-tree'
      className={`py-16 transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='relative w-full max-w-full'>
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
              <span
                className={`font-semibold transition-colors duration-300 ${
                  isDarkMode ? "text-amber-300" : "text-amber-800"
                }`}>
                شجرة العائلة
              </span>
            </div>
            {/* Toolbar */}
            <div className='flex flex-wrap items-center gap-2 p-4 justify-end'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleZoomIn}
                title={t("familyTree.zoomIn")}>
                <ZoomIn className='w-4 h-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleZoomOut}
                title={t("familyTree.zoomOut")}>
                <ZoomOut className='w-4 h-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleResetView}
                title={t("familyTree.resetView")}>
                <RotateCcw className='w-4 h-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowSettings((v) => !v)}
                title={t("familyTree.settings")}>
                <Settings className='w-4 h-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleExport("png")}
                title={t("familyTree.exportPNG")}>
                <Download className='w-4 h-4 mr-1' /> PNG
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleExport("pdf")}
                title={t("familyTree.exportPDF")}>
                <Download className='w-4 h-4 mr-1' /> PDF
              </Button>
            </div>
            {/* Settings panel (toggle) */}
            {showSettings && (
              <div
                className={`p-4 border-b ${
                  isDarkMode
                    ? "border-amber-600 bg-gray-900"
                    : "border-amber-200 bg-white"
                }`}>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label>
                      {t("familyTree.width")}: {cardWidth}px
                    </Label>
                    <Slider
                      value={[cardWidth]}
                      min={100}
                      max={200}
                      step={10}
                      onValueChange={(v) => setCardWidth(v[0])}
                    />
                  </div>
                  <div>
                    <Label>
                      {t("familyTree.height")}: {cardHeight}px
                    </Label>
                    <Slider
                      value={[cardHeight]}
                      min={50}
                      max={150}
                      step={10}
                      onValueChange={(v) => setCardHeight(v[0])}
                    />
                  </div>
                  <div>
                    <Label>
                      {t("familyTree.horizontalSpacing")}: {horizontalSpacing}x
                    </Label>
                    <Slider
                      value={[horizontalSpacing]}
                      min={1}
                      max={5}
                      step={0.1}
                      onValueChange={(v) => setHorizontalSpacing(v[0])}
                    />
                  </div>
                  <div>
                    <Label>
                      {t("familyTree.verticalSpacing")}: {verticalSpacing}x
                    </Label>
                    <Slider
                      value={[verticalSpacing]}
                      min={1}
                      max={5}
                      step={0.1}
                      onValueChange={(v) => setVerticalSpacing(v[0])}
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.maleColor")}</Label>
                    <input
                      type='color'
                      value={maleColor}
                      onChange={(e) => setMaleColor(e.target.value)}
                      className='w-full h-8 rounded cursor-pointer'
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.femaleColor")}</Label>
                    <input
                      type='color'
                      value={femaleColor}
                      onChange={(e) => setFemaleColor(e.target.value)}
                      className='w-full h-8 rounded cursor-pointer'
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.linkColor")}</Label>
                    <input
                      type='color'
                      value={linkColor}
                      onChange={(e) => setLinkColor(e.target.value)}
                      className='w-full h-8 rounded cursor-pointer'
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.showName")}</Label>
                    <Switch
                      checked={showLabels.name}
                      onCheckedChange={(v) => setShowLabel("name", v)}
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.showBirthYear")}</Label>
                    <Switch
                      checked={showLabels.birthYear}
                      onCheckedChange={(v) => setShowLabel("birthYear", v)}
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.showDeathYear")}</Label>
                    <Switch
                      checked={showLabels.deathYear}
                      onCheckedChange={(v) => setShowLabel("deathYear", v)}
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.showSpouses")}</Label>
                    <Switch
                      checked={showSpouses}
                      onCheckedChange={setShowSpouses}
                    />
                  </div>
                  <div>
                    <Label>{t("familyTree.showGenderIcon")}</Label>
                    <Switch
                      checked={showLabels.genderIcon}
                      onCheckedChange={(v) => setShowLabel("genderIcon", v)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className='family-tree-container'>
              {/* Only render BaseTree when we have data to prevent D3 errors */}
              {Object.keys(data).length > 0 && mainId ? (
                <BaseTree
                  data={data}
                  tree={tree}
                  mainId={mainId}
                  settings={settings}
                  relationships={relationships}
                  isEditable={false}
                  isDarkMode={isDarkMode}
                  onNodeClick={(node) => setFocusPerson(node.id)}
                  onAddRelative={() => {}}
                  selectedNodeId={focusPersonId || mainId}
                  setFocusPerson={setFocusPerson}
                />
              ) : (
                <div className='flex items-center justify-center h-96'>
                  <div className='text-center'>
                    <span
                      className={`mx-auto h-12 w-12 mb-4 animate-pulse ${
                        isDarkMode ? "text-amber-400" : "text-amber-600"
                      }`}>
                      ⏳
                    </span>
                    <p
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                      جاري تحضير شجرة العائلة...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
