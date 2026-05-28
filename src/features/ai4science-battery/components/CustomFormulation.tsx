import React, { useState } from "react";
import { FormulationEditor, IngredientRow, uid, rowsToFormulation } from "./FormulationEditor";
import { COMPONENT_LABEL_BY_KEY } from "../lib/componentUnits";

type Props = {
  availableComponents: string[];
  extraAdditives: string[];
  onChange: (payload: {
    formulation: Record<string, number>;
    extraAdditiveName: string;
    extraAdditiveAmount: number;
    nMax: number;
  }) => void;
};

export function CustomFormulation(props: Props) {
  const { availableComponents, extraAdditives, onChange } = props;
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [extraAdditiveName, setExtraAdditiveName] = useState<string>("None");
  const [extraAdditiveAmount, setExtraAdditiveAmount] = useState<number>(0);
  const [nMax, setNMax] = useState<number>(1500);

  function emit(nextRows: IngredientRow[], nextExtraName = extraAdditiveName, nextExtraAmount = extraAdditiveAmount, nextNMax = nMax) {
    onChange({
      formulation: rowsToFormulation(nextRows),
      extraAdditiveName: nextExtraName,
      extraAdditiveAmount: nextExtraAmount,
      nMax: nextNMax
    });
  }

  function setRowsAndEmit(next: IngredientRow[]) {
    setRows(next);
    emit(next);
  }

  return (
    <div className="card">
      <FormulationEditor
        title="Custom Formulation"
        rows={rows}
        availableComponents={availableComponents}
        componentLabelByKey={COMPONENT_LABEL_BY_KEY}
        onRowsChange={setRowsAndEmit}
      />

      <div className="row" style={{ marginBottom: 8 }}>
        <label className="cardHint">Max cycle：</label>
        <input
          className="input"
          type="number"
          min={10}
          max={10000}
          step={50}
          value={nMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            setNMax(v);
            emit(rows, extraAdditiveName, extraAdditiveAmount, v);
          }}
        />
      </div>

      <div style={{ marginBottom: 6, fontWeight: 700 }}>Extra Additive</div>
      <div className="row">
        <select
          className="select"
          value={extraAdditiveName}
          onChange={(e) => {
            const v = e.target.value;
            setExtraAdditiveName(v);
            emit(rows, v, extraAdditiveAmount, nMax);
          }}
        >
          {extraAdditives.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          step={0.1}
          min={0}
          disabled={extraAdditiveName === "None"}
          value={extraAdditiveAmount}
          onChange={(e) => {
            const v = Number(e.target.value);
            setExtraAdditiveAmount(v);
            emit(rows, extraAdditiveName, v, nMax);
          }}
        />
      </div>
    </div>
  );
}
