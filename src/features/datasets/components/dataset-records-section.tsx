import { useMemo, useState } from "react";

import { DatasetTable } from "@/components/dataset/dataset-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DatasetColumn, DatasetRow } from "@/types/dataset";

type DatasetRecordsSectionProps = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  visibleColumnKeys: string[];
  columnSearchQuery: string;
  highlightedRowIds: number[];
  allColumnsVisible: boolean;
  activeVisibleColumnCount: number;
  filteredVisibilityColumns: DatasetColumn[];
  visibleColumnKeySet: Set<string>;
  schemaKey: string;
  workspaceName: string;
  onColumnSearchChange: (value: string) => void;
  onToggleColumnVisibility: (columnKey: string) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  onUpdateCell: (rowId: number, field: string, value: string) => void;
  onExportRows: (rowIds: number[]) => void;
  onBulkMarkValid: (rowIds: number[]) => void;
};

type RecordsView = "all" | "affected";

export default function DatasetRecordsSection({
  columns,
  rows,
  visibleColumnKeys,
  columnSearchQuery,
  highlightedRowIds,
  allColumnsVisible,
  activeVisibleColumnCount,
  filteredVisibilityColumns,
  visibleColumnKeySet,
  schemaKey,
  workspaceName,
  onColumnSearchChange,
  onToggleColumnVisibility,
  onShowAllColumns,
  onHideAllColumns,
  onUpdateCell,
  onExportRows,
  onBulkMarkValid,
}: DatasetRecordsSectionProps) {
  const [recordsView, setRecordsView] = useState<RecordsView>("all");

  const affectedRowIdSet = useMemo(
    () => new Set(highlightedRowIds),
    [highlightedRowIds]
  );

  const affectedRows = useMemo(
    () => rows.filter((row) => affectedRowIdSet.has(row.id)),
    [rows, affectedRowIdSet]
  );

const hasAffectedRows = highlightedRowIds.length > 0;

const effectiveRecordsView =
  recordsView === "affected" && hasAffectedRows ? "affected" : "all";

const displayedRows =
  effectiveRecordsView === "affected" ? affectedRows : rows;


  return (
    <section className="relative rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {workspaceName}
          </p>

          <h2 className="mt-1 text-lg font-semibold">Dataset Records</h2>

          <p className="text-sm text-muted-foreground">
            Review, filter, edit, inspect, and export uploaded dataset records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            {rows.length} rows
          </span>

          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            {columns.length} columns
          </span>

          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            Preferences saved
          </span>
        </div>
      </div>

      <div className="mb-4 flex w-fit rounded-full border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setRecordsView("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            effectiveRecordsView  === "all"
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
          onClick={() => setRecordsView("affected")}
          disabled={highlightedRowIds.length === 0}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            effectiveRecordsView  === "affected"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Affected rows
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {highlightedRowIds.length}
          </span>
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-muted/20 p-3">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Column Visibility</p>
            <p className="text-xs text-muted-foreground">
              Choose which dataset fields appear in the table view.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onShowAllColumns}
              disabled={allColumnsVisible}
            >
              Show all
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onHideAllColumns}
              disabled={activeVisibleColumnCount === 0}
            >
              Hide all
            </Button>
          </div>
        </div>

        <input
          value={columnSearchQuery}
          onChange={(event) => onColumnSearchChange(event.target.value)}
          placeholder="Search columns..."
          className="mb-3 h-9 w-full rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Search dataset columns"
        />

        <div className="flex flex-wrap gap-2">
          {filteredVisibilityColumns.map((column) => {
            const isVisible = visibleColumnKeySet.has(column.key);

            return (
              <button
                key={column.key}
                type="button"
                onClick={() => onToggleColumnVisibility(column.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isVisible
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
                aria-pressed={isVisible}
              >
                {column.label}
              </button>
            );
          })}
        </div>
      </div>

      <DatasetTable
        key={`${schemaKey}-${effectiveRecordsView}`}
        columns={columns}
        rows={displayedRows}
        visibleColumnKeys={visibleColumnKeys}
        highlightedRowIds={highlightedRowIds}
        onUpdateCell={onUpdateCell}
        onExportRows={onExportRows}
        onBulkMarkValid={onBulkMarkValid}
      />
    </section>
  );
}