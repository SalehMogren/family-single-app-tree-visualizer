import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DragDropContext as DragDropContextType } from '../../lib/types';

interface DragDropContextType extends DragDropContext {
  startDrag: (nodeId: string, dragType: 'relationship' | 'position') => void;
  endDrag: () => void;
  setDropTarget: (nodeId: string | null) => void;
  handleDrop: (sourceId: string, targetId: string, relationshipType?: 'parent' | 'spouse' | 'child' | 'sibling') => void;
  onRelationshipDrop?: (sourceId: string, targetId: string, relationshipType: 'parent' | 'spouse' | 'child' | 'sibling') => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

interface DragDropProviderProps {
  children: React.ReactNode;
  onRelationshipDrop?: (sourceId: string, targetId: string, relationshipType: 'parent' | 'spouse' | 'child' | 'sibling') => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ 
  children, 
  onRelationshipDrop 
}) => {
  const [dragDropState, setDragDropState] = useState<DragDropContext>({
    isDragging: false,
    draggedNodeId: null,
    dropTargetId: null,
    dragType: 'relationship',
    validDropTargets: []
  });

  const startDrag = useCallback((nodeId: string, dragType: 'relationship' | 'position') => {
    setDragDropState(prev => ({
      ...prev,
      isDragging: true,
      draggedNodeId: nodeId,
      dragType,
      validDropTargets: [] // Will be calculated based on drag type and constraints
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDragDropState(prev => ({
      ...prev,
      isDragging: false,
      draggedNodeId: null,
      dropTargetId: null,
      validDropTargets: []
    }));
  }, []);

  const setDropTarget = useCallback((nodeId: string | null) => {
    setDragDropState(prev => ({
      ...prev,
      dropTargetId: nodeId
    }));
  }, []);

  const handleDrop = useCallback((
    sourceId: string, 
    targetId: string, 
    relationshipType?: 'parent' | 'spouse' | 'child' | 'sibling'
  ) => {
    if (dragDropState.dragType === 'relationship' && relationshipType && onRelationshipDrop) {
      onRelationshipDrop(sourceId, targetId, relationshipType);
    }
    endDrag();
  }, [dragDropState.dragType, onRelationshipDrop, endDrag]);

  const contextValue: DragDropContextType = {
    ...dragDropState,
    startDrag,
    endDrag,
    setDropTarget,
    handleDrop,
    onRelationshipDrop
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  return context;
};

// Helper hook for making nodes draggable
export const useDraggableNode = (nodeId: string) => {
  const context = useDragDrop();
  
  if (!context) {
    // Return default values when not in a DragDropProvider
    return {
      isDraggedNode: false,
      dragHandlers: {}
    };
  }
  
  const { startDrag, endDrag, isDragging, draggedNodeId } = context;
  
  const isDraggedNode = isDragging && draggedNodeId === nodeId;
  
  const dragHandlers = {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', nodeId);
      startDrag(nodeId, 'relationship');
    },
    onDragEnd: () => {
      endDrag();
    }
  };
  
  return {
    isDraggedNode,
    dragHandlers
  };
};

// Helper hook for making nodes drop targets
export const useDropTargetNode = (
  nodeId: string, 
  onDrop: (sourceId: string, targetId: string, relationshipType: 'parent' | 'spouse' | 'child' | 'sibling') => void
) => {
  const context = useDragDrop();
  
  if (!context) {
    // Return default values when not in a DragDropProvider
    return {
      isDropTarget: false,
      canAcceptDrop: false,
      dropHandlers: {}
    };
  }
  
  const { setDropTarget, dropTargetId, isDragging, draggedNodeId } = context;
  
  const isDropTarget = dropTargetId === nodeId;
  const canAcceptDrop = isDragging && draggedNodeId !== nodeId;
  
  const getRelationshipType = (sourceId: string, targetId: string): 'parent' | 'spouse' | 'child' | 'sibling' => {
    // This could be enhanced with more sophisticated logic
    // For now, return a default or let the user choose
    return 'spouse'; // Default relationship type
  };
  
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (canAcceptDrop) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDropTarget(nodeId);
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      // Only clear if we're actually leaving this element
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDropTarget(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== nodeId) {
        const relationshipType = getRelationshipType(sourceId, nodeId);
        onDrop(sourceId, nodeId, relationshipType);
      }
      setDropTarget(null);
    }
  };
  
  return {
    isDropTarget,
    canAcceptDrop,
    dropHandlers
  };
};