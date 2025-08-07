/**
 * @file Redux slice for managing the state of the family tree editor.
 * This includes the tree data, layout information, and undo/redo history.
 */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TreeState, FamilyMember, RelationshipConnection } from "../types";
import { calculateTree } from "../utils/CalculateTree";

/**
 * The initial state of the tree editor.
 */
const initialState: TreeState = {
  members: {}, // All members, keyed by ID
  relationships: [], // All relationships between members
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
  femaleColor: "hsl(var(--destructive))",
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
     * Updates the entire dataset of family members and relationships, recalculates the tree.
     */
    updateMembersAndRelationships(
      state,
      action: PayloadAction<{
        members: { [id: string]: FamilyMember };
        relationships: RelationshipConnection[];
      }>
    ) {
      state.past.push({
        members: state.members,
        relationships: state.relationships,
        tree: state.tree,
      });
      if (state.past.length > 50) state.past.shift();
      state.future = [];
      state.members = action.payload.members;
      state.relationships = action.payload.relationships;
      if (state.mainId) {
        state.tree = calculateTree({
          members: state.members,
          relationships: state.relationships,
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
      if (Object.keys(state.members).length > 0) {
        state.tree = calculateTree({
          members: state.members,
          relationships: state.relationships,
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
     * Forces a recalculation of the tree layout.
     * Useful when layout parameters change.
     */
    recalculateTree(state) {
      if (!state.mainId) return;
      state.tree = calculateTree({
        members: state.members,
        relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
      state.past.push({
        members: state.members,
        relationships: state.relationships,
        tree: state.tree,
      });
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
        {
          members: state.members,
          relationships: state.relationships,
          tree: state.tree,
        },
        ...state.future,
      ].slice(0, 50);
      state.members = previous.members;
      state.relationships = previous.relationships;
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
        {
          members: state.members,
          relationships: state.relationships,
          tree: state.tree,
        },
      ].slice(-50);
      state.members = next.members;
      state.relationships = next.relationships;
      state.tree = next.tree;
    },
    /**
     * Add a new member.
     */
    addMember(state, action: PayloadAction<FamilyMember>) {
      state.past.push({
        members: state.members,
        relationships: state.relationships,
        tree: state.tree,
      });
      if (state.past.length > 50) state.past.shift();
      state.future = [];
      state.members[action.payload.id] = action.payload;
    },
    /**
     * Update a member.
     */
    updateMember(state, action: PayloadAction<FamilyMember>) {
      state.members[action.payload.id] = action.payload;
    },
    /**
     * Delete a member and all relationships involving them.
     */
    deleteMember(state, action: PayloadAction<{ memberId: string }>) {
      const { memberId } = action.payload;
      delete state.members[memberId];
      state.relationships = state.relationships.filter(
        (rel) => rel.fromId !== memberId && rel.toId !== memberId
      );
      if (state.mainId === memberId) {
        state.mainId = Object.keys(state.members)[0] || "";
      }
    },
    /**
     * Add a relationship.
     */
    addRelationship(state, action: PayloadAction<RelationshipConnection>) {
      state.relationships.push(action.payload);
    },
    /**
     * Remove a relationship by id.
     */
    removeRelationship(state, action: PayloadAction<{ id: string }>) {
      state.relationships = state.relationships.filter(
        (rel) => rel.id !== action.payload.id
      );
    },
    /**
     * Placeholder for future relationship toggling logic.
     */
    toggleAllRels(state) {
      // Implement relationship toggling logic if needed
    },
    /**
     * Modify relationship between two people using RelationshipConnection[] model
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
      const { personId1, personId2, relationshipType, operation, metadata } =
        action.payload;
      // Helper to get relationship type and direction
      let connection: any = null;
      if (relationshipType === "parent" || relationshipType === "child") {
        // Always store as parent -> child
        const parentId = relationshipType === "parent" ? personId1 : personId2;
        const childId = relationshipType === "parent" ? personId2 : personId1;
        connection = createRelationshipObject(
          parentId,
          childId,
          "parent",
          false,
          metadata
        );
      } else if (relationshipType === "spouse") {
        connection = createRelationshipObject(
          personId1,
          personId2,
          "spouse",
          true,
          metadata
        );
      } else if (relationshipType === "sibling") {
        connection = createRelationshipObject(
          personId1,
          personId2,
          "sibling",
          true,
          metadata
        );
      }
      if (!connection) return;

      if (operation === "connect") {
        addRelationshipToState(state, connection);
      } else if (operation === "disconnect") {
        state.relationships = state.relationships.filter(
          (rel) =>
            !(
              rel.fromId === connection.fromId &&
              rel.toId === connection.toId &&
              rel.type === connection.type &&
              rel.bidirectional === connection.bidirectional
            )
        );
      } else if (operation === "modify") {
        // Find and update the relationship
        state.relationships = state.relationships.map((rel) => {
          if (
            rel.fromId === connection.fromId &&
            rel.toId === connection.toId &&
            rel.type === connection.type &&
            rel.bidirectional === connection.bidirectional
          ) {
            return { ...rel, ...(metadata || {}) };
          }
          return rel;
        });
      }

      // Recalculate tree after relationship modification
      if (state.mainId) {
        state.tree = calculateTree({
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
          members: state.members,
          relationships: state.relationships,
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
     * Fix relationship inconsistencies in RelationshipConnection[]
     * Removes duplicate and invalid connections
     */
    fixRelationshipInconsistencies(state) {
      // Remove duplicate relationships (same fromId, toId, type, bidirectional)
      const seen = new Set<string>();
      state.relationships = state.relationships.filter((rel) => {
        const key = `${rel.fromId}_${rel.type}_${rel.toId}_${rel.bidirectional}`;
        if (seen.has(key)) return false;
        seen.add(key);
        // Optionally, filter out relationships with missing members
        if (!state.members[rel.fromId] || !state.members[rel.toId])
          return false;
        return true;
      });
      // Recalculate tree after fixing inconsistencies
      if (state.mainId) {
        state.tree = calculateTree({
          members: state.members,
          relationships: state.relationships,
          mainId: state.mainId,
          nodeSeparation: state.nodeSeparation,
          levelSeparation: state.levelSeparation,
          showSpouses: state.showSpouses,
          viewMode: state.viewMode,
          focusPersonId: state.focusPersonId,
        });
      }
    },
    addRelative: {
      reducer(
        state,
        action: PayloadAction<{
          targetId: string;
          newMember: FamilyMember;
          type: "parent" | "spouse" | "child" | "sibling";
        }>
      ) {
        const { targetId, newMember, type } = action.payload;
        // Add the new member
        state.members[newMember.id] = newMember;
        // Add the correct relationship(s)
        if (type === "parent") {
          // newMember is parent, targetId is child
          const rel = createRelationshipObject(
            newMember.id,
            targetId,
            "parent",
            false
          );
          addRelationshipToState(state, rel);
        } else if (type === "child") {
          // newMember is child, targetId is parent
          const rel = createRelationshipObject(
            targetId,
            newMember.id,
            "parent",
            false
          );
          addRelationshipToState(state, rel);
        } else if (type === "spouse") {
          // Bidirectional spouse
          const rel = createRelationshipObject(
            targetId,
            newMember.id,
            "spouse",
            true
          );
          addRelationshipToState(state, rel);
        } else if (type === "sibling") {
          // Add all parents of targetId as parents of newMember
          addSiblingRelationships(state, newMember.id, targetId);
        }
        // Recalculate tree
        if (state.mainId) {
          state.tree = calculateTree({
            members: state.members,
            relationships: state.relationships,
            mainId: state.mainId,
            nodeSeparation: state.nodeSeparation,
            levelSeparation: state.levelSeparation,
            showSpouses: state.showSpouses,
            viewMode: state.viewMode,
            focusPersonId: state.focusPersonId,
          });
        }
      },
      prepare(payload: {
        targetId: string;
        newMember: FamilyMember;
        type: "parent" | "spouse" | "child" | "sibling";
      }) {
        return { payload };
      },
    },
  },
});

// --- Helper Functions ---
function createRelationshipObject(
  fromId: string,
  toId: string,
  type: "parent" | "spouse" | "sibling",
  bidirectional = false,
  metadata: any = {}
) {
  return {
    id: `${fromId}_${type}_${toId}`,
    fromId,
    toId,
    type,
    bidirectional,
    ...metadata,
  };
}

function relationshipExists(
  state: TreeState,
  rel: { fromId: string; toId: string; type: string; bidirectional: boolean }
) {
  return state.relationships.some(
    (r) =>
      r.fromId === rel.fromId &&
      r.toId === rel.toId &&
      r.type === rel.type &&
      r.bidirectional === rel.bidirectional
  );
}

function addRelationshipToState(state: TreeState, rel: any) {
  if (!relationshipExists(state, rel)) {
    state.relationships.push(rel);
  }
}

function addSiblingRelationships(
  state: TreeState,
  newId: string,
  siblingId: string
) {
  // Add all parents of siblingId as parents of newId
  const parentRels = state.relationships.filter(
    (r) => r.type === "parent" && r.toId === siblingId
  );
  parentRels.forEach((parentRel) => {
    const rel = createRelationshipObject(
      parentRel.fromId,
      newId,
      "parent",
      false
    );
    addRelationshipToState(state, rel);
  });
}
// --- End Helper Functions ---

export const {
  updateMembersAndRelationships,
  updateMainId,
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
} = treeSlice.actions;

export default treeSlice.reducer;
