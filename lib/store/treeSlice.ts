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
  levelSeparation: 150, // Vertical separation between levels
  showSpouses: true,
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
        });
      }
    },
    /**
     * Toggles the visibility of spouses and recalculates the tree.
     */
    setShowSpouses(state, action: PayloadAction<boolean>) {
      state.showSpouses = action.payload;
      if (state.mainId) {
        recalculateTree();
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
        relationType: "parent" | "spouse" | "child";
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
        state.mainId = newId;
      }
    },
    /**
     * Updates the data for a specific node.
     */
    updateNode(state, action: PayloadAction<FamilyMember>) {
      state.data[action.payload.id] = action.payload;
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
    },
    /**
     * Placeholder for future relationship toggling logic.
     */
    toggleAllRels(state) {
      // Implement relationship toggling logic if needed
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
  setShowSpouses,
  undo,
  redo,
  toggleAllRels,
  saveState,
  addNode,
  updateNode,
  deleteNode,
} = treeSlice.actions;

export default treeSlice.reducer;
