import { useMemo } from "react";

import { DatasetTable } from "@/components/dataset/dataset-table";
import { cn } from "@/lib/utils";
import { DatasetColumn, DatasetRow } from "@/types/dataset";
import { DataGridColumnsPanelModel } from "@/types/data-grid-types";

type RecordsView = "all" | "affected";

type RecordsViewIntent = {
  mode: RecordsView;
  key: string;
  suggestionId?: string;
};

type DatasetRecordsSectionProps = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  visibleColumnKeys: string[];
  highlightedRowIds: number[];
  activeVisibleColumnCount: number;
  schemaKey: string;
  recordsViewIntent: RecordsViewIntent;
  pinnedColumnKeys: string[];
  columnsPanel?: DataGridColumnsPanelModel;
  onUpdateCell: (rowId: number, field: string, value: string) => void;
  onExportRows: (rowIds: number[]) => void;
  onBulkMarkValid: (rowIds: number[]) => void;
  onRecordsViewChange: (view: RecordsView) => void;
};

export default function DatasetRecordsSection({
  columns,
  rows,
  visibleColumnKeys,
  highlightedRowIds,
  activeVisibleColumnCount,
  schemaKey,
  recordsViewIntent,
  pinnedColumnKeys,
  columnsPanel,
  onUpdateCell,
  onExportRows,
  onBulkMarkValid,
  onRecordsViewChange,
}: DatasetRecordsSectionProps) {
  const affectedRowIdSet = useMemo(
    () => new Set(highlightedRowIds),
    [highlightedRowIds]
  );

  const affectedRows = useMemo(
    () => rows.filter((row) => affectedRowIdSet.has(row.id)),
    [rows, affectedRowIdSet]
  );

  const hasAffectedRows = affectedRows.length > 0;

  const effectiveRecordsView: RecordsView =
    recordsViewIntent.mode === "affected" && hasAffectedRows
      ? "affected"
      : "all";

  const displayedRows =
    effectiveRecordsView === "affected" ? affectedRows : rows;

  const recordsViewSelector = (
    <div className="flex rounded-full border border-border bg-muted/30 p-1">
      <button
        type="button"
        onClick={() => onRecordsViewChange("all")}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
          effectiveRecordsView === "all"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All records
        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {rows.length}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onRecordsViewChange("affected")}
        disabled={!hasAffectedRows}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          effectiveRecordsView === "affected"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Affected rows
        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {affectedRows.length}
        </span>
      </button>
    </div>
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Dataset Records</h2>

      <DatasetTable
        key={`${schemaKey}-${effectiveRecordsView}-${recordsViewIntent.key}`}
        columns={columns}
        rows={displayedRows}
        visibleColumnKeys={visibleColumnKeys}
        highlightedRowIds={highlightedRowIds}
        onUpdateCell={onUpdateCell}
        onExportRows={onExportRows}
        onBulkMarkValid={onBulkMarkValid}
        pinnedColumnKeys={pinnedColumnKeys}
        activeVisibleColumnCount={activeVisibleColumnCount}
        recordsViewSelector={recordsViewSelector}
        columnsPanel={columnsPanel}
      />
    </section>
  );
}