import React from "react";
import { useTreeStore } from "../../hooks/useTreeStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Users,
  TreePine,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";

export function DebugComponent() {
  const {
    data,
    tree,
    mainId,
    viewMode,
    focusPersonId,
    nodeSeparation,
    levelSeparation,
    showSpouses,
    canUndo,
    canRedo,
    recalculateTree,
    fixRelationshipInconsistencies,
  } = useTreeStore();

  const totalPeople = Object.keys(data).length;
  const totalTreeNodes = tree.length;
  const mainPerson = data[mainId];

  // Calculate some statistics
  const peopleWithParents = Object.values(data).filter(
    (p) => p.parents && p.parents.length > 0
  ).length;
  const peopleWithSpouses = Object.values(data).filter(
    (p) => p.spouses && p.spouses.length > 0
  ).length;
  const peopleWithChildren = Object.values(data).filter(
    (p) => p.children && p.children.length > 0
  ).length;

  // Check for potential issues
  const orphanedReferences = Object.values(data).filter((person) => {
    return (
      person.parents?.some((parentId) => !data[parentId]) ||
      person.spouses?.some((spouseId) => !data[spouseId]) ||
      person.children?.some((childId) => !data[childId])
    );
  }).length;

  const hasIssues = orphanedReferences > 0;

  const exportData = () => {
    const exportObj = {
      mainId,
      data,
      timestamp: new Date().toISOString(),
      stats: {
        totalPeople,
        totalTreeNodes,
        peopleWithParents,
        peopleWithSpouses,
        peopleWithChildren,
        orphanedReferences,
      },
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-tree-debug-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <Info className='w-5 h-5' />
          Debug Information
        </h3>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={recalculateTree}
            className='flex items-center gap-1'>
            <RefreshCw className='w-4 h-4' />
            Recalc
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={exportData}
            className='flex items-center gap-1'>
            <Download className='w-4 h-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className='flex gap-2'>
        {hasIssues ? (
          <Badge variant='destructive' className='flex items-center gap-1'>
            <AlertTriangle className='w-3 h-3' />
            {orphanedReferences} Issues
          </Badge>
        ) : (
          <Badge variant='default' className='flex items-center gap-1'>
            <CheckCircle className='w-3 h-3' />
            Data Valid
          </Badge>
        )}
        <Badge variant='outline'>
          <Users className='w-3 h-3 mr-1' />
          {totalPeople} People
        </Badge>
        <Badge variant='outline'>
          <TreePine className='w-3 h-3 mr-1' />
          {totalTreeNodes} Nodes
        </Badge>
      </div>

      {/* Main Information */}
      <div className='grid grid-cols-2 gap-4 text-sm'>
        <div>
          <strong>Main Person:</strong>
          <div className='text-gray-600 dark:text-gray-400'>
            {mainPerson ? mainPerson.name : "None"}
          </div>
        </div>
        <div>
          <strong>View Mode:</strong>
          <div className='text-gray-600 dark:text-gray-400'>
            {viewMode} {focusPersonId && `(${data[focusPersonId]?.name})`}
          </div>
        </div>
        <div>
          <strong>Node Separation:</strong>
          <div className='text-gray-600 dark:text-gray-400'>
            {nodeSeparation}px
          </div>
        </div>
        <div>
          <strong>Level Separation:</strong>
          <div className='text-gray-600 dark:text-gray-400'>
            {levelSeparation}px
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className='space-y-2'>
        <h4 className='font-medium'>Statistics:</h4>
        <div className='grid grid-cols-2 gap-2 text-sm'>
          <div>With Parents: {peopleWithParents}</div>
          <div>With Spouses: {peopleWithSpouses}</div>
          <div>With Children: {peopleWithChildren}</div>
          <div>Orphaned Ref: {orphanedReferences}</div>
        </div>
      </div>

      {/* History */}
      <div className='space-y-2'>
        <h4 className='font-medium'>History:</h4>
        <div className='flex gap-2'>
          <Badge variant={canUndo ? "default" : "secondary"}>
            Undo: {canUndo ? "Available" : "None"}
          </Badge>
          <Badge variant={canRedo ? "default" : "secondary"}>
            Redo: {canRedo ? "Available" : "None"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      {hasIssues && (
        <div className='space-y-2'>
          <h4 className='font-medium text-orange-600'>Issues Detected:</h4>
          <Button
            size='sm'
            variant='outline'
            onClick={fixRelationshipInconsistencies}
            className='flex items-center gap-1'>
            <RefreshCw className='w-4 h-4' />
            Fix Relationships
          </Button>
        </div>
      )}

      {/* Sample Data */}
      <div className='space-y-2'>
        <h4 className='font-medium'>Sample People:</h4>
        <div className='space-y-1 text-xs'>
          {Object.values(data)
            .slice(0, 5)
            .map((person) => (
              <div key={person.id} className='flex justify-between'>
                <span>{person.name}</span>
                <span className='text-gray-500'>
                  {person.parents?.length || 0}P, {person.spouses?.length || 0}
                  S, {person.children?.length || 0}C
                </span>
              </div>
            ))}
          {totalPeople > 5 && (
            <div className='text-gray-500'>... and {totalPeople - 5} more</div>
          )}
        </div>
      </div>
    </Card>
  );
}
