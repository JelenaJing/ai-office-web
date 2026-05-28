import { create } from "zustand";
import type { PolymerRecommendation } from "../services/api";
import type { CalcPropertyResponse } from "../services/calcApi";

export type ExtendedRecommendation = PolymerRecommendation & {
  targetPolymer?: string;
  formula?: string;
  smiles?: string;
  pubchemName?: string;
};

interface FormulationBridge {
  recommendations: ExtendedRecommendation[];
  selectedTargets: string[];
  extraGoal: string;
}

interface PropertyBridge {
  polymerName: string;
  monomers: string;
  result: CalcPropertyResponse | null;
}

interface ToolBridgeState {
  formulation: FormulationBridge | null;
  property: PropertyBridge | null;
  setFormulationFromChat: (payload: FormulationBridge) => void;
  consumeFormulation: () => FormulationBridge | null;
  setPropertyFromChat: (payload: PropertyBridge) => void;
  consumeProperty: () => PropertyBridge | null;
}

export const useToolBridgeStore = create<ToolBridgeState>((set, get) => ({
  formulation: null,
  property: null,
  setFormulationFromChat: (payload) => set({ formulation: payload }),
  consumeFormulation: () => {
    const data = get().formulation;
    if (data) set({ formulation: null });
    return data;
  },
  setPropertyFromChat: (payload) => set({ property: payload }),
  consumeProperty: () => {
    const data = get().property;
    if (data) set({ property: null });
    return data;
  },
}));
