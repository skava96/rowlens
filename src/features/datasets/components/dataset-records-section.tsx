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
  activeSuggestionTitle?: string;
  activeSuggestionStatus?: "pending" | "approved" | "ignored" | "resolved";
  activeSuggestionResolvedRowIds?: number[];
  activeSuggestionTargetField?: string;
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
  activeSuggestionTitle,
  activeSuggestionStatus,
  activeSuggestionResolvedRowIds = [],
  activeSuggestionTargetField,
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

  const resolvedAffectedRowIdSet = useMemo(
    () => new Set(activeSuggestionResolvedRowIds),
    [activeSuggestionResolvedRowIds]
  );

  const remainingAffectedRowCount =
    affectedRows.length -
    affectedRows.filter((row) => resolvedAffectedRowIdSet.has(row.id)).length;

  const reviewedAffectedRowCount =
    affectedRows.length - remainingAffectedRowCount;

  const hasAffectedRowsNeedingAttention = affectedRows.some(
    (row) => row.validationState !== "valid"
  );

  const isResolvedByManualEdit =
    activeSuggestionStatus === "resolved" &&
    remainingAffectedRowCount === 0 &&
    !hasAffectedRowsNeedingAttention;

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
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Dataset Records</h2>

          <p className="text-sm text-muted-foreground">
            Review and edit dataset records.
          </p>
        </div>

        {effectiveRecordsView === "affected" &&
          activeSuggestionTitle && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-sky-950">
                    Reviewing: {activeSuggestionTitle}
                  </p>

                  <p className="mt-0.5 text-xs text-sky-800">
                    {isResolvedByManualEdit
                      ? "These rows were resolved by manual edits."
                      : activeSuggestionStatus === "approved" ||
                          activeSuggestionStatus === "ignored"
                        ? "These rows are shown for audit context."
                        : "These rows need attention before continuing."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full border border-sky-200 bg-background px-2.5 py-1 text-sky-900">
                    {affectedRows.length} affected{" "}
                    {affectedRows.length === 1 ? "row" : "rows"}
                  </span>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">
                    {reviewedAffectedRowCount} reviewed
                  </span>

                  {activeSuggestionStatus === "pending" && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                      {remainingAffectedRowCount} pending review
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="mt-4">
        <DatasetTable
          key={`${schemaKey}-${effectiveRecordsView}-${recordsViewIntent.key}`}
          columns={columns}
          rows={displayedRows}
          schemaKey={schemaKey}
          visibleColumnKeys={visibleColumnKeys}
          highlightedRowIds={highlightedRowIds}
          highlightedField={activeSuggestionTargetField}
          onUpdateCell={onUpdateCell}
          onExportRows={onExportRows}
          onBulkMarkValid={onBulkMarkValid}
          pinnedColumnKeys={pinnedColumnKeys}
          activeVisibleColumnCount={activeVisibleColumnCount}
          recordsViewSelector={recordsViewSelector}
          columnsPanel={columnsPanel}
        />
      </div>
    </section>
  );
}
