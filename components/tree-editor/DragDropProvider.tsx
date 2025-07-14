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

// Helper hook for making nodes draggable with enhanced UX like Miro/Draw.io
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
      e.stopPropagation(); // Prevent event bubbling to SVG
      
      // Create a custom drag image that shows connection intent
      const dragImage = document.createElement('div');
      dragImage.innerHTML = `
        <div style="
          background: rgba(59, 130, 246, 0.9); 
          color: white; 
          padding: 8px 12px; 
          border-radius: 6px; 
          font-size: 14px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          white-space: nowrap;
        ">
          🔗 إنشاء علاقة جديدة
        </div>
      `;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', nodeId);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Clean up drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
      
      startDrag(nodeId, 'relationship');
    },
    onDragEnd: (e: React.DragEvent) => {
      e.stopPropagation();
      endDrag();
    },
    onMouseDown: (e: React.MouseEvent) => {
      // Add visual feedback on mouse down
      e.stopPropagation();
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
    // Show a modal or use intelligent detection
    // For now, we'll prompt the user to choose
    const relationships = [
      { value: 'parent', label: 'والد/والدة' },
      { value: 'spouse', label: 'زوج/زوجة' },
      { value: 'child', label: 'طفل' },
      { value: 'sibling', label: 'شقيق/شقيقة' }
    ];
    
    // Use a simple prompt for now - can be enhanced with a proper modal later
    const choice = prompt(
      'اختر نوع العلاقة:\n' + 
      relationships.map((r, i) => `${i + 1}. ${r.label}`).join('\n'),
      '2'
    );
    
    const index = parseInt(choice || '2') - 1;
    return relationships[index]?.value as 'parent' | 'spouse' | 'child' | 'sibling' || 'spouse';
  };
  
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (canAcceptDrop) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setDropTarget(nodeId);
      }
    },
    onDragEnter: (e: React.DragEvent) => {
      if (canAcceptDrop) {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(nodeId);
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      e.stopPropagation();
      // Only clear if we're actually leaving this element
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDropTarget(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== nodeId) {
        // Show relationship selection modal or use smart detection
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