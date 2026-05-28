import React, { useState } from "react";
import { FormulationEditor, IngredientRow, rowsToFormulation } from "./FormulationEditor";
import { COMPONENT_LABEL_BY_KEY } from "../lib/componentUnits";

type Props = {
  availableComponents: string[];
  onFormulationChange: (formulation: Record<string, number>) => void;
};

/**
 * Same ingredient UX as Custom Formulation, but only stores the recipe for uploaded experiment data.
 */
export function ExperimentFormulationPanel(props: Props) {
  const { availableComponents, onFormulationChange } = props;
  const [rows, setRows] = useState<IngredientRow[]>([]);

  function setRowsAndEmit(next: IngredientRow[]) {
    setRows(next);
    onFormulationChange(rowsToFormulation(next));
  }

  return (
    <div className="card">
      <FormulationEditor
        title="实验数据对应配方"
        rows={rows}
        availableComponents={availableComponents}
        componentLabelByKey={COMPONENT_LABEL_BY_KEY}
        onRowsChange={setRowsAndEmit}
      />
    </div>
  );
}
