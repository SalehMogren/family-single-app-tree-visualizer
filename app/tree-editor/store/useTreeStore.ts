import { create } from "zustand";
import { TreeNodeData } from "../types";
import { calculateTree } from "../utils/CalculateTree";

interface TreeState {
  data: any;
  tree: TreeNodeData[] | null;
  mainId: string | null;
  focusNodeId: string | null;
  nodeSeparation: number;
  levelSeparation: number;
  updateData: (data: any) => void;
  updateMainId: (id: string) => void;
  recalculateTree: () => void;
  toggleAllRels: () => void;
  undo: () => void;
  redo: () => void;
  setFocusNode: (id: string) => void;
  loadInitialData: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  data: null,
  tree: null,
  mainId: null,
  focusNodeId: null,
  nodeSeparation: 100,
  levelSeparation: 100,
  updateData: (data) =>
    set((state) => {
      const calculatedTree = data
        ? calculateTree({
            data: data,
            mainId: state.mainId || data.rootId,
            nodeSeparation: state.nodeSeparation,
            levelSeparation: state.levelSeparation,
          })
        : null;
      return { data, tree: calculatedTree };
    }),
  updateMainId: (id) => set({ mainId: id }),
  recalculateTree: () =>
    set((state) => {
      if (!state.data) return {};
      const calculatedTree = calculateTree({
        data: state.data,
        mainId: state.mainId || state.data.rootId,
        nodeSeparation: state.nodeSeparation,
        levelSeparation: state.levelSeparation,
      });
      return { tree: calculatedTree };
    }),
  toggleAllRels: () => set((state) => ({ tree: state.tree })),
  undo: () => set((state) => ({ tree: state.tree })),
  redo: () => set((state) => ({ tree: state.tree })),
  setFocusNode: (id) => set({ focusNodeId: id }),
  loadInitialData: () =>
    set((state) => {
      const initialData = {
        rootId: "1",
        members: {
          "1": {
            id: "1",
            name: "Root Member",
            gender: "male",
            birth_year: 1980,
            parents: ["2", "3"],
            children: ["4"],
            spouses: ["5"],
          },
          "2": {
            id: "2",
            name: "Father",
            gender: "male",
            birth_year: 1950,
            children: ["1"],
            spouses: ["3"],
          },
          "3": {
            id: "3",
            name: "Mother",
            gender: "female",
            birth_year: 1955,
            children: ["1"],
            spouses: ["2"],
          },
          "4": {
            id: "4",
            name: "Child",
            gender: "male",
            birth_year: 2010,
            parents: ["1", "5"],
          },
          "5": {
            id: "5",
            name: "Spouse",
            gender: "female",
            birth_year: 1985,
            spouses: ["1"],
            children: ["4"],
          },
        },
      };
      const calculatedTree = calculateTree({
        data: initialData,
        mainId: initialData.rootId,
        nodeSeparation: state.nodeSeparation,
        levelSeparation: state.levelSeparation,
      });
      return {
        data: initialData,
        tree: calculatedTree,
        mainId: initialData.rootId,
      };
    }),
}));
