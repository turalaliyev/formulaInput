// formulaStore.ts
import { create } from "zustand";

interface FormulaState {
  formula: string;
  result: number | null;
  setFormula: (formula: string) => void;
  setResult: (result: number | null) => void;
}

export const useFormulaStore = create<FormulaState>((set) => ({
  formula: "",
  result: null,
  setFormula: (formula) => set({ formula }),
  setResult: (result) => set({ result }),
}));
