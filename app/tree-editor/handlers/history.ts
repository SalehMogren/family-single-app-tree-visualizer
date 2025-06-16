import { FamilyTree } from "../types";

interface HistoryState {
  past: FamilyTree[];
  future: FamilyTree[];
  present: FamilyTree;
}

interface HistoryAction {
  type: "UNDO" | "REDO" | "PUSH";
  payload?: FamilyTree;
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction
): HistoryState {
  switch (action.type) {
    case "UNDO":
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };

    case "REDO":
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };

    case "PUSH":
      if (!action.payload) return state;
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [],
      };

    default:
      return state;
  }
}

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0;
}

export function pushHistory(
  state: HistoryState,
  newTree: FamilyTree
): HistoryState {
  return historyReducer(state, { type: "PUSH", payload: newTree });
}

export function undoHistory(state: HistoryState): HistoryState {
  return historyReducer(state, { type: "UNDO" });
}

export function redoHistory(state: HistoryState): HistoryState {
  return historyReducer(state, { type: "REDO" });
}
