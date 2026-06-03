import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  Info,
  Sparkles,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DatasetColumn, DatasetRow } from "@/types/dataset";

import { formatCellValue, getValidationLabel } from "./dataset-table-utils";

interface RowInspectorProps {
  columns: DatasetColumn[];
  selectedRow: DatasetRow;
}

export function RowInspector({
  columns,
  selectedRow,
}: RowInspectorProps) {

  return (
    <aside className="h-full overflow-hidden bg-card"
      aria-labelledby="row-inspector-title"
      aria-describedby="row-inspector-description"
    >
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Row #{selectedRow.id}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  selectedRow.validationState === "valid" &&
                  "bg-emerald-100 text-emerald-700",
                  selectedRow.validationState === "missing" &&
                  "bg-amber-100 text-amber-700",
                  selectedRow.validationState === "invalid" &&
                  "bg-red-100 text-red-700"
                )}
              >
                {selectedRow.validationState === "valid" && (
                  <CheckCircle className="h-3 w-3" />
                )}
                {selectedRow.validationState === "missing" && (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {selectedRow.validationState === "invalid" && (
                  <XCircle className="h-3 w-3" />
                )}
                {getValidationLabel(selectedRow.validationState)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  selectedRow.reviewState === "reviewed"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {selectedRow.reviewState === "reviewed" ? "Reviewed" : "Unreviewed"}
              </span>
            </div>

            <h2 id="row-inspector-title" className="text-lg font-semibold">
              Row Inspector
            </h2>
            <p
              id="row-inspector-description"
              className="text-sm text-muted-foreground"
            >
              Review field values, validation metadata, and applied corrections.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_375px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Field Values</p>
              <p className="text-xs text-muted-foreground">
                {columns.length} fields detected in this record.
              </p>
            </div>

            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {
                columns.filter((column) =>
                  selectedRow.transformedFields?.includes(column.key)
                ).length
              }{" "}
              corrected
            </span>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {columns.map((column) => {
              const isValidationField =
                selectedRow.validationField === column.key;

              const isTransformed =
                selectedRow.transformedFields?.includes(column.key);

              return (
                <section
                  key={column.key}
                  className={cn(
                    "rounded-xl border border-border bg-muted/20 p-3 transition-colors",
                    isValidationField &&
                    selectedRow.validationState === "missing" &&
                    "border-amber-200 bg-amber-50",
                    isValidationField &&
                    selectedRow.validationState === "invalid" &&
                    "border-red-200 bg-red-50",
                    isTransformed && "border-emerald-200 bg-emerald-50/70"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {column.label}
                      </p>

                      <p className="mt-0.5 break-all text-[11px] text-muted-foreground">
                        {column.key}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      {isValidationField && (
                        <span className="inline-flex rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Issue
                        </span>
                      )}

                      {isTransformed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <Sparkles className="h-3 w-3" />
                          Corrected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="break-words rounded-lg bg-background/70 px-3 py-2 text-sm font-medium text-foreground">
                    {formatCellValue(selectedRow.values[column.key])}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Validation Metadata</p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Current state</p>
                <p className="font-medium">
                  {getValidationLabel(selectedRow.validationState)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Review state</p>
                <p className="font-medium">
                  {selectedRow.reviewState === "reviewed" ? "Reviewed" : "Unreviewed"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Issue field</p>
                <p className="font-medium">
                  {selectedRow.validationField ?? "None"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Corrected fields
                </p>
                <p className="font-medium">
                  {selectedRow.transformedFields?.length
                    ? selectedRow.transformedFields.join(", ")
                    : "None"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Review Timeline</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2 text-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground" />
                <div>
                  <p className="font-medium">Record loaded</p>
                  <p className="text-xs text-muted-foreground">
                    Imported from uploaded dataset.
                  </p>
                </div>
              </div>

              {selectedRow.validationField && (
                <div className="flex gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <div>
                    <p className="font-medium">Validation issue detected</p>
                    <p className="text-xs text-muted-foreground">
                      Field: {selectedRow.validationField}
                    </p>
                  </div>
                </div>
              )}

              {selectedRow.reviewState === "reviewed" && (
                <div className="flex gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                  <div>
                    <p className="font-medium">Record reviewed</p>
                    <p className="text-xs text-muted-foreground">
                      This row was manually marked as reviewed.
                    </p>
                  </div>
                </div>
              )}

              {(selectedRow.transformedFields?.length ?? 0) > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium">AI correction applied</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRow.transformedFields?.length} field(s)
                      corrected.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Inspector Actions</p>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Inline edits are available directly in the dataset table. Select a
              highlighted field to update and audit the change.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}