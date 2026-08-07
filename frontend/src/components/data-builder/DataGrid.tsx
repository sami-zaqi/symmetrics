"use client";

import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellClassParams,
  type CellValueChangedEvent,
  type ColDef,
} from "ag-grid-community";
import type { VariableDef } from "@/lib/types";

ModuleRegistry.registerModules([AllCommunityModule]);

export type GridRow = Record<string, string>;

function emptyRow(variables: VariableDef[]): GridRow {
  return Object.fromEntries(variables.map((v) => [v.name, ""]));
}

function isCellInvalid(variable: VariableDef, value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false; // empty = missing, not invalid
  const str = String(value).trim();
  if (variable.categories && variable.categories.length > 0) {
    return !variable.categories.some((c) => String(c.value) === str);
  }
  if (variable.scale === "interval" || variable.scale === "rasio") {
    return Number.isNaN(Number(str));
  }
  return false;
}

export default function DataGrid({
  variables,
  onRowsChange,
}: {
  variables: VariableDef[];
  onRowsChange: (rows: GridRow[]) => void;
}) {
  const [rowData, setRowData] = useState<GridRow[]>(() =>
    Array.from({ length: 5 }, () => emptyRow(variables))
  );

  const columnDefs = useMemo<ColDef[]>(
    () =>
      variables.map((v) => {
        const hasCategories = !!(v.categories && v.categories.length > 0);
        return {
          field: v.name,
          headerName: v.name,
          headerTooltip: `${v.label} (${v.scale})`,
          editable: true,
          minWidth: 130,
          cellEditor: hasCategories ? "agSelectCellEditor" : undefined,
          cellEditorParams: hasCategories
            ? { values: ["", ...(v.categories ?? []).map((c) => String(c.value))] }
            : undefined,
          cellClassRules: {
            "cell-invalid": (params: CellClassParams) => isCellInvalid(v, params.value),
          },
        };
      }),
    [variables]
  );

  function updateRows(rows: GridRow[]) {
    setRowData(rows);
    onRowsChange(rows);
  }

  function addRows(count: number) {
    updateRows([...rowData, ...Array.from({ length: count }, () => emptyRow(variables))]);
  }

  function handleCellValueChanged(e: CellValueChangedEvent<GridRow>) {
    const rowIndex = e.node.rowIndex;
    const field = e.colDef.field;
    if (rowIndex == null || !field) return;
    updateRows(rowData.map((row, i) => (i === rowIndex ? { ...row, [field]: e.newValue ?? "" } : row)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button onClick={() => addRows(1)} className="btn-duo-outline btn-duo-sm">
          + 1 Baris
        </button>
        <button onClick={() => addRows(10)} className="btn-duo-outline btn-duo-sm">
          + 10 Baris
        </button>
      </div>
      <div style={{ height: 380, width: "100%" }}>
        <AgGridReact
          theme={themeQuartz}
          rowData={rowData}
          columnDefs={columnDefs}
          onCellValueChanged={handleCellValueChanged}
          stopEditingWhenCellsLoseFocus
        />
      </div>
      <p className="text-xs font-semibold text-duo-gray-soft">
        Sel berwarna <span className="cell-invalid rounded px-1 text-duo-red-dark">merah</span> berarti nilai
        tidak sesuai skala/kode yang sudah didefinisikan. Sel kosong dianggap data hilang, bukan error.
      </p>
    </div>
  );
}
