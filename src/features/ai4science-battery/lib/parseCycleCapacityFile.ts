/**
 * Cycle–capacity tables: column 0 = cycle, column 1 = capacity (any header text, skipped).
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedCycleCapacity = { cycles: number[]; capacities: number[] };

/** Parse CSV: first row is header (ignored), cols 0/1 numeric */
export function parseCycleCapacityCsv(text: string): ParsedCycleCapacity {
  const res = Papa.parse(text, { header: false, skipEmptyLines: true });
  const rows = res.data as unknown[][];
  const cycles: number[] = [];
  const capacities: number[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    const c = Number(String(row[0]).trim());
    const cap = Number(String(row[1]).trim());
    if (Number.isFinite(c) && Number.isFinite(cap)) {
      cycles.push(c);
      capacities.push(cap);
    }
  }
  return { cycles, capacities };
}

/** Parse Excel: first sheet, first row skipped, cols A/B */
export function parseCycleCapacityExcel(arrayBuffer: ArrayBuffer): ParsedCycleCapacity {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { cycles: [], capacities: [] };
  const ws = wb.Sheets[sheetName];
  if (!ws) return { cycles: [], capacities: [] };
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false
  }) as unknown[][];
  const cycles: number[] = [];
  const capacities: number[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length < 2) continue;
    const c = Number(row[0]);
    const cap = Number(row[1]);
    if (Number.isFinite(c) && Number.isFinite(cap)) {
      cycles.push(c);
      capacities.push(cap);
    }
  }
  return { cycles, capacities };
}
