import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { FamilyMember, FamilyTree } from "../types";

interface TreeState {
  data: FamilyTree | null;
  tree: any[]; // Will be populated by CalculateTree
  mainId: string | null;
  focusNodeId: string | null;
  nodeSeparation: number;
  levelSeparation: number;
  past: FamilyTree[];
  future: FamilyTree[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TreeState = {
  data: null,
  tree: [],
  mainId: null,
  focusNodeId: null,
  nodeSeparation: 200,
  levelSeparation: 150,
  past: [],
  future: [],
  status: "idle",
  error: null,
};

export const fetchFamilyData = createAsyncThunk(
  "tree/fetchFamilyData",
  async () => {
    const response = await fetch("/data/family-data.json");
    if (!response.ok) {
      throw new Error("Failed to fetch family data");
    }
    return response.json();
  }
);

const treeSlice = createSlice({
  name: "tree",
  initialState,
  reducers: {
    updateMainId: (state, action: PayloadAction<string>) => {
      state.mainId = action.payload;
    },
    recalculateTree: (state, action: PayloadAction<any[]>) => {
      state.tree = action.payload;
    },
    setFocusNode: (state, action: PayloadAction<string | null>) => {
      state.focusNodeId = action.payload;
    },
    undo: (state) => {
      if (state.past.length === 0) return;
      const previous = state.past[state.past.length - 1];
      state.data = previous;
      state.past = state.past.slice(0, -1);
      if (state.data) {
        state.future = [state.data, ...state.future];
      }
    },
    redo: (state) => {
      if (state.future.length === 0) return;
      const next = state.future[0];
      state.data = next;
      if (state.data) {
        state.past = [...state.past, state.data];
      }
      state.future = state.future.slice(1);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFamilyData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFamilyData.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (state.data) {
          state.past = [...state.past, state.data];
        }
        state.data = action.payload;
        state.future = [];
      })
      .addCase(fetchFamilyData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch family data";
      });
  },
});

export const { updateMainId, recalculateTree, setFocusNode, undo, redo } =
  treeSlice.actions;
export default treeSlice.reducer;
