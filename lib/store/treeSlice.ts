/**
 * @file Redux slice for managing the state of the family tree editor.
 * This includes the tree data, layout information, and undo/redo history.
 */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TreeState, FamilyMember } from "../types";
import { calculateTree } from "../utils/CalculateTree";

/**
 * The initial state of the tree editor.
 */
const initialState: TreeState = {
  data: {}, // All members, keyed by ID
  tree: [], // The hierarchical tree structure for rendering
  mainId: "", // The ID of the root member of the tree
  focusNodeId: null, // The ID of the currently focused node
  nodeSeparation: 200, // Horizontal separation between nodes
  levelSeparation: 120, // Vertical separation between levels
  horizontalSpacing: 2.2, // Visual horizontal spacing multiplier
  verticalSpacing: 1.8, // Visual vertical spacing multiplier
  showSpouses: true,
  viewMode: "full", // "full" or "focus" (3-level view)
  focusPersonId: null, // For 3-level focus view
  // Visual appearance settings
  cardWidth: 160,
  cardHeight: 90,
  maleColor: "hsl(var(--primary))",
  femaleColor: "#DC2626",
  linkColor: "hsl(var(--muted-foreground))",
  lineShape: "curved",
  // Label visibility toggles
  showLabels: {
    name: true,
    birthYear: true,
    deathYear: true,
    spouse: true,
    genderIcon: true,
  },
  past: [], // History stack for undo
  future: [], // History stack for redo
};

/**
 * The main Redux slice for the tree editor.
 */
const treeSlice = createSlice({
  name: "tree",
  initialState,
  reducers: {
    /**
     * Updates the entire dataset of family members and recalculates the tree.
     */
    updateData(state, action: PayloadAction<{ [id: string]: FamilyMember }>) {
      state.past.push({ data: state.data, tree: state.tree });
      if (state.past.length > 50) state.past.shift();
      state.future = [];
      state.data = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Updates the root node of the tree and recalculates the layout.
     */
    updateMainId(state, action: PayloadAction<string>) {
      state.mainId = action.payload;
      if (Object.keys(state.data).length > 0) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * A combined action to update both data and mainId at once.
     */
    updateDataAndMainId(
      state,
      action: PayloadAction<{
        data: { [id: string]: FamilyMember };
        mainId: string;
      }>
    ) {
      state.past.push({ data: state.data, tree: state.tree });
      if (state.past.length > 50) state.past.shift();
      state.future = [];
      state.data = action.payload.data;
      state.mainId = action.payload.mainId;
      state.tree = calculateTree({
        data: state.data,
        mainId: state.mainId,
        nodeSeparation: state.nodeSeparation,
        levelSeparation: state.levelSeparation,
        showSpouses: state.showSpouses,
        viewMode: state.viewMode,
        focusPersonId: state.focusPersonId,
      });
    },
    /**
     * Forces a recalculation of the tree layout.
     * Useful when layout parameters change.
     */
    recalculateTree(state) {
      if (!state.mainId) return;
      state.tree = calculateTree({
        data: state.data,
        mainId: state.mainId,
        nodeSeparation: state.nodeSeparation,
        levelSeparation: state.levelSeparation,
        showSpouses: state.showSpouses,
        viewMode: state.viewMode,
        focusPersonId: state.focusPersonId,
      });
    },
    /**
     * Sets the ID of the node that is currently in focus (e.g., selected).
     */
    setFocusNode(state, action: PayloadAction<string | null>) {
      state.focusNodeId = action.payload;
    },
    /**
     * Updates the horizontal separation between nodes and recalculates the tree.
     */
    setNodeSeparation(state, action: PayloadAction<number>) {
      state.nodeSeparation = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Updates the vertical separation between levels and recalculates the tree.
     */
    setLevelSeparation(state, action: PayloadAction<number>) {
      state.levelSeparation = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Updates the visual horizontal spacing multiplier and recalculates tree.
     */
    setHorizontalSpacing(state, action: PayloadAction<number>) {
      state.horizontalSpacing = action.payload;
      // Update node separation based on spacing multiplier
      const baseNodeSeparation = 200; // Base separation
      state.nodeSeparation = baseNodeSeparation * state.horizontalSpacing;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Updates the visual vertical spacing multiplier and recalculates tree.
     */
    setVerticalSpacing(state, action: PayloadAction<number>) {
      state.verticalSpacing = action.payload;
      // Update level separation based on spacing multiplier
      const baseLevelSeparation = 120; // Base separation
      state.levelSeparation = baseLevelSeparation * state.verticalSpacing;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Toggles the visibility of spouses and recalculates the tree.
     */
    setShowSpouses(state, action: PayloadAction<boolean>) {
      state.showSpouses = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the view mode (full or focus) and recalculates the tree.
     */
    setViewMode(state, action: PayloadAction<"full" | "focus">) {
      state.viewMode = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the focus person for 3-level view and switches to focus mode.
     */
    setFocusPerson(state, action: PayloadAction<string | null>) {
      state.focusPersonId = action.payload;
      if (action.payload) {
        state.viewMode = "focus";
      }
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Saves the current state to the 'past' stack for undo purposes.
     */
    saveState(state) {
      state.past.push({ data: state.data, tree: state.tree });
      if (state.past.length > 50) state.past.shift();
      state.future = [];
    },
    /**
     * Reverts to the previous state from the 'past' stack.
     */
    undo(state) {
      if (state.past.length === 0) return;
      const previous = state.past[state.past.length - 1];
      state.past = state.past.slice(0, -1);
      state.future = [
        { data: state.data, tree: state.tree },
        ...state.future,
      ].slice(0, 50);
      state.data = previous.data;
      state.tree = previous.tree;
    },
    /**
     * Moves forward to the next state from the 'future' stack.
     */
    redo(state) {
      if (state.future.length === 0) return;
      const next = state.future[0];
      state.future = state.future.slice(1);
      state.past = [
        ...state.past,
        { data: state.data, tree: state.tree },
      ].slice(-50);
      state.data = next.data;
      state.tree = next.tree;
    },
    /**
     * Adds a new node to the tree as a relative of a target node.
     */
    addNode(
      state,
      action: PayloadAction<{
        targetId: string;
        relationType: "parent" | "spouse" | "child" | "sibling";
        data: Partial<FamilyMember>;
      }>
    ) {
      const { targetId, relationType, data } = action.payload;
      const newId = `person_${Date.now()}`;
      const newNode: FamilyMember = {
        id: newId,
        name: data.name || "New Person",
        gender: data.gender || "male",
        birth_year: data.birth_year || 1980,
        death_year: data.death_year,
        parents: [],
        spouses: [],
        children: [],
        ...data,
      };

      state.data[newId] = newNode;

      // Handle the case where this is the first person (no target)
      if (!targetId || targetId === "") {
        state.mainId = newId;
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
        return;
      }

      const targetNode = state.data[targetId];

      if (!targetNode) {
        console.error(`[addNode] Target node with id "${targetId}" not found.`);
        return;
      }

      if (relationType === "child") {
        newNode.parents = [targetId];
        targetNode.children = [...(targetNode.children || []), newId];
        // Also add to spouse if exists
        if (targetNode.spouses && targetNode.spouses.length > 0) {
          const spouse = state.data[targetNode.spouses[0]];
          if (spouse) {
            newNode.parents.push(spouse.id);
            spouse.children = [...(spouse.children || []), newId];
          }
        }
      } else if (relationType === "spouse") {
        newNode.spouses = [targetId];
        targetNode.spouses = [...(targetNode.spouses || []), newId];
      } else if (relationType === "parent") {
        // Prevent adding more than two parents
        if (targetNode.parents && targetNode.parents.length >= 2) {
          console.warn("Cannot add more than two parents.");
          return;
        }

        newNode.children = [...(newNode.children || []), targetId];
        targetNode.parents = [...(targetNode.parents || []), newId];

        // If one parent already exists, link them as spouses
        const existingParentId = (targetNode.parents || []).find(
          (pId) => pId !== newId
        );
        if (existingParentId) {
          const existingParent = state.data[existingParentId];
          if (existingParent) {
            existingParent.spouses = [...(existingParent.spouses || []), newId];
            newNode.spouses = [...(newNode.spouses || []), existingParentId];
          }
        }
        // Update mainId to the new parent for better tree visualization
        if (!state.mainId || state.mainId === "") {
          state.mainId = newId;
        }
      } else if (relationType === "sibling") {
        // For siblings, we need to share the same parents
        if (targetNode.parents && targetNode.parents.length > 0) {
          // Add the new sibling to the same parents
          newNode.parents = [...targetNode.parents];

          // Add the new sibling as a child to each parent
          targetNode.parents.forEach((parentId) => {
            const parent = state.data[parentId];
            if (parent) {
              parent.children = [...(parent.children || []), newId];
            }
          });
        } else {
          // If target has no parents, we can't create a sibling relationship
          console.warn(
            "Cannot create sibling relationship: target has no parents."
          );
          // Remove the node we just created
          delete state.data[newId];
          return;
        }
      }

      // Recalculate tree after adding node
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Updates the data for a specific node.
     */
    updateNode(state, action: PayloadAction<FamilyMember>) {
      state.data[action.payload.id] = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Deletes a node and all references to it from the tree.
     */
    deleteNode(state, action: PayloadAction<{ nodeId: string }>) {
      const { nodeId } = action.payload;
      const nodeToDelete = state.data[nodeId];
      if (!nodeToDelete) return;

      // Remove references from other nodes
      Object.values(state.data).forEach((p) => {
        if (p.parents?.includes(nodeId)) {
          p.parents = p.parents.filter((id) => id !== nodeId);
        }
        if (p.spouses?.includes(nodeId)) {
          p.spouses = p.spouses.filter((id) => id !== nodeId);
        }
        if (p.children?.includes(nodeId)) {
          p.children = p.children.filter((id) => id !== nodeId);
        }
      });

      // Delete the node
      delete state.data[nodeId];

      // If the mainId was deleted, find a new one
      if (state.mainId === nodeId) {
        state.mainId = Object.keys(state.data)[0] || "";
      }

      // Recalculate tree after deletion
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Placeholder for future relationship toggling logic.
     */
    toggleAllRels(state) {
      // Implement relationship toggling logic if needed
    },
    /**
     * Modify relationship between two people
     */
    modifyRelationship(
      state,
      action: PayloadAction<{
        personId1: string;
        personId2: string;
        relationshipType: "parent" | "spouse" | "child" | "sibling";
        operation: "connect" | "disconnect" | "modify";
        metadata?: any;
      }>
    ) {
      const { personId1, personId2, relationshipType, operation } =
        action.payload;
      const person1 = state.data[personId1];
      const person2 = state.data[personId2];

      if (!person1 || !person2) {
        console.error(
          "One or both persons not found for relationship modification"
        );
        return;
      }

      if (operation === "disconnect") {
        // Remove relationship connections
        if (relationshipType === "parent") {
          // Remove parent-child connection
          person1.children =
            person1.children?.filter((id) => id !== personId2) || [];
          person2.parents =
            person2.parents?.filter((id) => id !== personId1) || [];
        } else if (relationshipType === "spouse") {
          // Remove spouse connection
          person1.spouses =
            person1.spouses?.filter((id) => id !== personId2) || [];
          person2.spouses =
            person2.spouses?.filter((id) => id !== personId1) || [];
        } else if (relationshipType === "child") {
          // Remove child-parent connection
          person1.parents =
            person1.parents?.filter((id) => id !== personId2) || [];
          person2.children =
            person2.children?.filter((id) => id !== personId1) || [];
        } else if (relationshipType === "sibling") {
          // For siblings, we need to check if they share parents
          // This is complex and may require updating parent relationships
          console.warn(
            "Sibling relationship disconnection requires complex logic"
          );
        }
      } else if (operation === "connect") {
        // Add relationship connections (ensuring no duplicates)
        if (relationshipType === "parent") {
          // Add parent-child connection (person1 is parent, person2 is child)
          if (!person1.children?.includes(personId2)) {
            person1.children = [...(person1.children || []), personId2];
          }
          if (!person2.parents?.includes(personId1)) {
            person2.parents = [...(person2.parents || []), personId1];
          }
        } else if (relationshipType === "spouse") {
          // Add spouse connection (bidirectional)
          if (!person1.spouses?.includes(personId2)) {
            person1.spouses = [...(person1.spouses || []), personId2];
          }
          if (!person2.spouses?.includes(personId1)) {
            person2.spouses = [...(person2.spouses || []), personId1];
          }
        } else if (relationshipType === "child") {
          // Add child-parent connection (person1 is child, person2 is parent)
          if (!person1.parents?.includes(personId2)) {
            person1.parents = [...(person1.parents || []), personId2];
          }
          if (!person2.children?.includes(personId1)) {
            person2.children = [...(person2.children || []), personId1];
          }
        } else if (relationshipType === "sibling") {
          // For siblings, they should share the same parents
          // We'll connect them through their parents if they exist
          if (person1.parents && person1.parents.length > 0) {
            // Make person2 a child of person1's parents
            person1.parents.forEach((parentId) => {
              const parent = state.data[parentId];
              if (parent && !parent.children?.includes(personId2)) {
                parent.children = [...(parent.children || []), personId2];
              }
              if (!person2.parents?.includes(parentId)) {
                person2.parents = [...(person2.parents || []), parentId];
              }
            });
          } else if (person2.parents && person2.parents.length > 0) {
            // Make person1 a child of person2's parents
            person2.parents.forEach((parentId) => {
              const parent = state.data[parentId];
              if (parent && !parent.children?.includes(personId1)) {
                parent.children = [...(parent.children || []), personId1];
              }
              if (!person1.parents?.includes(parentId)) {
                person1.parents = [...(person1.parents || []), parentId];
              }
            });
          }
        }
      }

      // Recalculate tree after relationship modification
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the card width and recalculates tree if needed.
     */
    setCardWidth(state, action: PayloadAction<number>) {
      state.cardWidth = action.payload;
      // Optionally recalculate nodeSeparation based on new card width
      state.nodeSeparation = state.cardWidth * state.horizontalSpacing;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the card height and recalculates tree if needed.
     */
    setCardHeight(state, action: PayloadAction<number>) {
      state.cardHeight = action.payload;
      // Optionally recalculate levelSeparation based on new card height
      state.levelSeparation = state.cardHeight * state.verticalSpacing;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the male color.
     */
    setMaleColor(state, action: PayloadAction<string>) {
      state.maleColor = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the female color.
     */
    setFemaleColor(state, action: PayloadAction<string>) {
      state.femaleColor = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the link color.
     */
    setLinkColor(state, action: PayloadAction<string>) {
      state.linkColor = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the line shape.
     */
    setLineShape(state, action: PayloadAction<"straight" | "curved">) {
      state.lineShape = action.payload;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Sets the visibility of a specific label type.
     */
    setShowLabel(
      state,
      action: PayloadAction<{
        labelType: "name" | "birthYear" | "deathYear" | "spouse" | "genderIcon";
        visible: boolean;
      }>
    ) {
      const { labelType, visible } = action.payload;
      state.showLabels[labelType] = visible;
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    /**
     * Fix relationship inconsistencies automatically
     */
    fixRelationshipInconsistencies(state) {
      Object.values(state.data).forEach((person) => {
        // Fix missing reciprocal parent-child relationships
        person.parents?.forEach((parentId) => {
          const parent = state.data[parentId];
          if (parent && !parent.children?.includes(person.id)) {
            parent.children = [...(parent.children || []), person.id];
          }
        });

        // Fix missing reciprocal child-parent relationships
        person.children?.forEach((childId) => {
          const child = state.data[childId];
          if (child && !child.parents?.includes(person.id)) {
            child.parents = [...(child.parents || []), person.id];
          }
        });

        // Fix missing reciprocal spouse relationships
        person.spouses?.forEach((spouseId) => {
          const spouse = state.data[spouseId];
          if (spouse && !spouse.spouses?.includes(person.id)) {
            spouse.spouses = [...(spouse.spouses || []), person.id];
          }
        });
      });

      // Recalculate tree after fixing inconsistencies
      if (state.mainId) {
        state.tree = calculateTree({
          data: state.data,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
  },
});

export const {
  updateData,
  updateMainId,
  updateDataAndMainId,
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
  addNode,
  updateNode,
  deleteNode,
  modifyRelationship,
  fixRelationshipInconsistencies,
} = treeSlice.actions;

export default treeSlice.reducer;
