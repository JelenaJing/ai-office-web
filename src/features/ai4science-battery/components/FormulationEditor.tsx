import React, { useMemo } from "react";

export type IngredientRow = {
  id: string;
  component: string;
  amount: number;
};

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type Props = {
  title: string;
  hint?: string;
  rows: IngredientRow[];
  availableComponents: string[];
  componentLabelByKey?: Record<string, string>;
  onRowsChange: (next: IngredientRow[]) => void;
  /** Extra header actions (e.g. add button placement) */
  actions?: React.ReactNode;
};

export function FormulationEditor(props: Props) {
  const { title, hint, rows, availableComponents, componentLabelByKey, onRowsChange, actions } = props;

  const used = useMemo(() => new Set(rows.map((r) => r.component).filter(Boolean)), [rows]);
  const canAddMore = used.size < availableComponents.length;

  function addRow() {
    const remaining = availableComponents.filter((c) => !used.has(c));
    const first = remaining[0] ?? "";
    onRowsChange([...rows, { id: uid(), component: first, amount: 0 }]);
  }

  function updateRow(id: string, patch: Partial<IngredientRow>) {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    onRowsChange(rows.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="cardHeader" style={{ padding: 0, marginBottom: 8 }}>
        <div>
          <div className="cardTitle">{title}</div>
          {hint ? <div className="cardHint">{hint}</div> : null}
        </div>
        <div className="row">
          {actions}
          <button className={`btn ${canAddMore ? "btnPrimary" : ""}`} type="button" onClick={addRow} disabled={!canAddMore}>
            + 增加一种成分
          </button>
        </div>
      </div>

      {rows.map((r) => {
        const options = availableComponents.filter((c) => c === r.component || !used.has(c));
        return (
          <div key={r.id} className="row" style={{ marginBottom: 8 }}>
            <select className="select" value={r.component} onChange={(e) => updateRow(r.id, { component: e.target.value })}>
              {options.map((c) => (
                <option key={c} value={c}>
                  {componentLabelByKey?.[c] ?? c}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              step={0.1}
              value={Number.isFinite(r.amount) ? r.amount : 0}
              onChange={(e) => updateRow(r.id, { amount: Number(e.target.value) })}
            />
            <button type="button" className="btn btnDanger" onClick={() => removeRow(r.id)}>
              删除
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function rowsToFormulation(rows: IngredientRow[]): Record<string, number> {
  const f: Record<string, number> = {};
  for (const r of rows) {
    if (!r.component) continue;
    f[r.component] = Number.isFinite(r.amount) ? r.amount : 0;
  }
  return f;
}
