/**
 * @file Custom hook for interacting with the tree's Redux store.
 * This simplifies component logic by providing direct access to state and action dispatchers.
 */
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../lib/store/store";
import {
  updateMainId,
  updateMembersAndRelationships,
  recalculateTree,
  setFocusNode,
  setNodeSeparation,
  setLevelSeparation,
  setHorizontalSpacing,
  setVerticalSpacing,
  setShowSpouses,
  setViewMode,
  setFocusPerson,
  setCardWidth,
  setCardHeight,
  setMaleColor,
  setFemaleColor,
  setLinkColor,
  setLineShape,
  setShowLabel,
  undo,
  redo,
  toggleAllRels,
  saveState,
  addMember,
  updateMember,
  deleteMember,
  addRelationship,
  removeRelationship,
  modifyRelationship,
  fixRelationshipInconsistencies,
  addRelative,
} from "../lib/store/treeSlice";
import { FamilyMember } from "../lib/types";

/**
 * A custom hook that provides a simplified interface to the Redux store
 * for managing the family tree. It exposes state selectors and action dispatchers.
 *
 * @returns An object containing the tree state and functions to modify it.
 */
export function useTreeStore() {
  // Select individual state properties to avoid unnecessary re-renders
  const data = useSelector((state: RootState) => state.tree.members);
  const tree = useSelector((state: RootState) => state.tree.tree);
  const mainId = useSelector((state: RootState) => state.tree.mainId);
  const focusNodeId = useSelector((state: RootState) => state.tree.focusNodeId);
  const nodeSeparation = useSelector(
    (state: RootState) => state.tree.nodeSeparation
  );
  const levelSeparation = useSelector(
    (state: RootState) => state.tree.levelSeparation
  );
  const horizontalSpacing = useSelector(
    (state: RootState) => state.tree.horizontalSpacing
  );
  const verticalSpacing = useSelector(
    (state: RootState) => state.tree.verticalSpacing
  );
  const showSpouses = useSelector((state: RootState) => state.tree.showSpouses);
  const viewMode = useSelector((state: RootState) => state.tree.viewMode);
  const focusPersonId = useSelector(
    (state: RootState) => state.tree.focusPersonId
  );
  const cardWidth = useSelector((state: RootState) => state.tree.cardWidth);
  const cardHeight = useSelector((state: RootState) => state.tree.cardHeight);
  const maleColor = useSelector((state: RootState) => state.tree.maleColor);
  const femaleColor = useSelector((state: RootState) => state.tree.femaleColor);
  const linkColor = useSelector((state: RootState) => state.tree.linkColor);
  const lineShape = useSelector((state: RootState) => state.tree.lineShape);
  const showLabels = useSelector((state: RootState) => state.tree.showLabels);
  const past = useSelector((state: RootState) => state.tree.past);
  const future = useSelector((state: RootState) => state.tree.future);
  const relationships = useSelector(
    (state: RootState) => state.tree.relationships
  );

  // Get the dispatch function to send actions to the store.
  const dispatch = useDispatch<AppDispatch>();

  return {
    // Expose individual state properties
    data,
    tree,
    mainId,
    focusNodeId,
    nodeSeparation,
    levelSeparation,
    horizontalSpacing,
    verticalSpacing,
    showSpouses,
    viewMode,
    focusPersonId,
    cardWidth,
    cardHeight,
    maleColor,
    femaleColor,
    linkColor,
    lineShape,
    showLabels,
    past,
    future,
    relationships,

    // Expose action dispatchers, wrapped to handle side effects like saving history.
    updateMainId: (mainId: string) => dispatch(updateMainId(mainId)),
    updateMembersAndRelationships: (payload: {
      members: { [id: string]: FamilyMember };
      relationships: any[];
    }) => {
      dispatch(saveState());
      dispatch(updateMembersAndRelationships(payload));
    },
    addMember: (member: FamilyMember) => {
      dispatch(saveState());
      dispatch(addMember(member));
    },
    updateMember: (member: FamilyMember) => {
      dispatch(saveState());
      dispatch(updateMember(member));
    },
    deleteMember: (memberId: string) => {
      dispatch(saveState());
      dispatch(deleteMember({ memberId }));
    },
    addRelationship: (rel: any) => {
      dispatch(saveState());
      dispatch(addRelationship(rel));
    },
    removeRelationship: (id: string) => {
      dispatch(saveState());
      dispatch(removeRelationship({ id }));
    },
    modifyRelationship: (
      personId1: string,
      personId2: string,
      operation: "connect" | "disconnect" | "modify",
      relationshipType: "parent" | "spouse" | "child" | "sibling",
      metadata?: any
    ) => {
      dispatch(saveState());
      dispatch(
        modifyRelationship({
          personId1,
          personId2,
          relationshipType,
          operation,
          metadata,
        })
      );
    },
    addRelative: (payload: {
      targetId: string;
      newMember: FamilyMember;
      type: "parent" | "spouse" | "child" | "sibling";
    }) => {
      dispatch(saveState());
      dispatch(addRelative(payload));
    },
    fixRelationshipInconsistencies: () => {
      dispatch(saveState());
      dispatch(fixRelationshipInconsistencies());
    },
    // Expose other utility and history actions directly.
    recalculateTree: () => dispatch(recalculateTree()),
    setFocusNode: (nodeId: string | null) => dispatch(setFocusNode(nodeId)),
    setNodeSeparation: (separation: number) =>
      dispatch(setNodeSeparation(separation)),
    setLevelSeparation: (separation: number) =>
      dispatch(setLevelSeparation(separation)),
    setHorizontalSpacing: (spacing: number) =>
      dispatch(setHorizontalSpacing(spacing)),
    setVerticalSpacing: (spacing: number) =>
      dispatch(setVerticalSpacing(spacing)),
    setShowSpouses: (show: boolean) => dispatch(setShowSpouses(show)),
    toggleShowSpouses: () => dispatch(setShowSpouses(!showSpouses)),
    setViewMode: (mode: "full" | "focus") => dispatch(setViewMode(mode)),
    setFocusPerson: (personId: string | null) =>
      dispatch(setFocusPerson(personId)),
    setCardWidth: (width: number) => dispatch(setCardWidth(width)),
    setCardHeight: (height: number) => dispatch(setCardHeight(height)),
    setMaleColor: (color: string) => dispatch(setMaleColor(color)),
    setFemaleColor: (color: string) => dispatch(setFemaleColor(color)),
    setLinkColor: (color: string) => dispatch(setLinkColor(color)),
    setLineShape: (shape: "straight" | "curved") =>
      dispatch(setLineShape(shape)),
    setShowLabel: (
      labelType: "name" | "birthYear" | "deathYear" | "spouse" | "genderIcon",
      visible: boolean
    ) => dispatch(setShowLabel({ labelType, visible })),
    undo: () => dispatch(undo()),
    redo: () => dispatch(redo()),
    toggleAllRels: () => dispatch(toggleAllRels()),
    saveState: () => dispatch(saveState()),
    // Provide boolean flags for UI components to check if undo/redo is possible.
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
