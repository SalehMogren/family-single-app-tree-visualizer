/**
 * @file Custom hook for interacting with the tree's Redux store.
 * This simplifies component logic by providing direct access to state and action dispatchers.
 */
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../lib/store/store";
import {
  updateData,
  updateMainId,
  updateDataAndMainId,
  recalculateTree,
  setFocusNode,
  setNodeSeparation,
  setLevelSeparation,
  setViewMode,
  setFocusPerson,
  undo,
  redo,
  toggleAllRels,
  saveState,
  addNode,
  updateNode,
  deleteNode,
  modifyRelationship,
  fixRelationshipInconsistencies,
} from "../lib/store/treeSlice";
import { FamilyMember } from "../lib/types";

/**
 * A custom hook that provides a simplified interface to the Redux store
 * for managing the family tree. It exposes state selectors and action dispatchers.
 *
 * @returns An object containing the tree state and functions to modify it.
 */
export function useTreeStore() {
  // Select the entire tree state from the Redux store.
  const state = useSelector((state: RootState) => state.tree);
  // Get the dispatch function to send actions to the store.
  const dispatch = useDispatch<AppDispatch>();

  return {
    // Expose all state properties (data, tree, mainId, etc.).
    ...state,

    // Expose action dispatchers, wrapped to handle side effects like saving history.
    updateData: (data: { [id: string]: any }) => {
      dispatch(saveState());
      dispatch(updateData(data));
    },
    updateMainId: (mainId: string) => dispatch(updateMainId(mainId)),
    updateDataAndMainId: (data: { [id: string]: any }, mainId: string) => {
      dispatch(saveState());
      dispatch(updateDataAndMainId({ data, mainId }));
    },
    addNode: (
      targetId: string,
      relationType: "parent" | "spouse" | "child" | "sibling",
      data: Partial<FamilyMember>
    ) => {
      dispatch(saveState());
      dispatch(addNode({ targetId, relationType, data }));
      dispatch(recalculateTree());
    },
    updateNode: (node: FamilyMember) => {
      dispatch(saveState());
      dispatch(updateNode(node));
      dispatch(recalculateTree());
    },
    deleteNode: (nodeId: string) => {
      dispatch(saveState());
      dispatch(deleteNode({ nodeId }));
      dispatch(recalculateTree());
    },
    modifyRelationship: (
      personId1: string,
      personId2: string,
      operation: "connect" | "disconnect" | "modify",
      relationshipType: "parent" | "spouse" | "child" | "sibling",
      metadata?: any
    ) => {
      dispatch(saveState());
      dispatch(modifyRelationship({ personId1, personId2, relationshipType, operation, metadata }));
      dispatch(recalculateTree());
    },
    fixRelationshipInconsistencies: () => {
      dispatch(saveState());
      dispatch(fixRelationshipInconsistencies());
      dispatch(recalculateTree());
    },

    // Expose other utility and history actions directly.
    recalculateTree: () => dispatch(recalculateTree()),
    setFocusNode: (nodeId: string | null) => dispatch(setFocusNode(nodeId)),
    setNodeSeparation: (separation: number) =>
      dispatch(setNodeSeparation(separation)),
    setLevelSeparation: (separation: number) =>
      dispatch(setLevelSeparation(separation)),
    setViewMode: (mode: "full" | "focus") => dispatch(setViewMode(mode)),
    setFocusPerson: (personId: string | null) => dispatch(setFocusPerson(personId)),
    undo: () => dispatch(undo()),
    redo: () => dispatch(redo()),
    toggleAllRels: () => dispatch(toggleAllRels()),
    saveState: () => dispatch(saveState()),

    // Provide boolean flags for UI components to check if undo/redo is possible.
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
