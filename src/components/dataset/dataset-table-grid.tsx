import { AlertTriangle, CheckCircle, XCircle, ArrowUp, ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { DatasetColumn, DatasetRow } from "@/types/dataset";

import { formatCellValue, SortConfig } from "./dataset-table-utils";

interface DatasetTableGridProps {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  visibleColumns: DatasetColumn[];
  highlightedRowIdSet: Set<number>;
  selectedRowIdSet: Set<number>;
  selectedRow: DatasetRow | null;
  selectedRowIds: number[];
  editingCell: {
    rowId: number;
    field: string;
  } | null;
  draftValue: string;
  sortConfig: SortConfig;
  allVisibleRowsSelected: boolean;
  hasPartialVisibleSelection: boolean;
  onToggleSort: (field: string) => void;
  onToggleVisibleRowsSelection: () => void;
  onToggleRowSelection: (rowId: number) => void;
  onSelectRow: (row: DatasetRow) => void;
  onStartEditing: (
    rowId: number,
    field: string,
    currentValue: DatasetRow["values"][string]
  ) => void;
  onDraftValueChange: (value: string) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onExportSelectedRows: () => void;
  onBulkMarkSelectedRowsValid: () => void;
  onClearSelection: () => void;
  onResetFilters: () => void;
  onClearSearch: () => void;
}

export function DatasetTableGrid({
  rows,
  visibleColumns,
  highlightedRowIdSet,
  selectedRowIdSet,
  selectedRow,
  selectedRowIds,
  editingCell,
  draftValue,
  sortConfig,
  allVisibleRowsSelected,
  hasPartialVisibleSelection,
  onToggleSort,
  onToggleVisibleRowsSelection,
  onToggleRowSelection,
  onSelectRow,
  onStartEditing,
  onDraftValueChange,
  onSaveEditing,
  onCancelEditing,
  onExportSelectedRows,
  onBulkMarkSelectedRowsValid,
  onClearSelection,
  onResetFilters,
  onClearSearch,
}: DatasetTableGridProps) {

  const getAriaSort = (field: string) => {
    if (sortConfig?.field !== field) return "none";

    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  return (
    <>
      {selectedRowIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-950">
              {selectedRowIds.length} rows selected across this table view.
            </p>
            <p className="text-xs text-sky-800">
              Bulk actions will apply to selected dataset records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearSelection}
            >
              Clear selection
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onBulkMarkSelectedRowsValid}
            >
              Mark reviewed
            </Button>

            <Button type="button" size="sm" onClick={onExportSelectedRows}>
              Export selected
            </Button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <Table className="min-w-[900px] text-sm">
            <caption className="sr-only">
              Uploaded dataset records with dynamic columns, validation status,
              editable cells, and highlighted rows for selected AI suggestions.
            </caption>

            <TableHeader className="sticky top-0 z-20 border-b border-border bg-slate-50">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="sticky left-0 top-0 z-30 w-[48px] border-r border-border bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleRowsSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = hasPartialVisibleSelection;
                      }
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onChange={onToggleVisibleRowsSelection}
                    aria-label={
                      hasPartialVisibleSelection
                        ? "Some visible rows selected"
                        : "Select all visible rows"
                    }
                    aria-checked={
                      hasPartialVisibleSelection ? "mixed" : allVisibleRowsSelected
                    }
                  />
                </TableHead>

                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={getAriaSort(column.key)}
                    className="sticky top-0 z-10 min-w-[180px] px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleSort(column.key)}
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                      {sortConfig?.field === column.key && (
                        <span aria-hidden="true">
                          {sortConfig.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </button>
                  </TableHead>
                ))}

                <TableHead
                  aria-sort={getAriaSort("__validation")}
                  className="sticky top-0 z-10 min-w-[180px] px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground"
                >
                  <button
                    type="button"
                    onClick={() => onToggleSort("__validation")}
                    className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label="Sort by validation status"
                  >
                    Validation
                    {sortConfig?.field === "__validation" && (
                      <span aria-hidden="true">
                        {sortConfig.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </button>

                </TableHead>
                <TableHead className="sticky top-0 z-10 w-[120px] px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 3}
                    className="px-4 py-10 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="rounded-full border border-border bg-muted/30 p-3">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-foreground">
                        No matching records found
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting filters or clearing the current search query.
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onResetFilters();
                          }}
                        >
                          Reset filters
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onClearSearch();
                          }}
                        >
                          Clear search
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isHighlighted = highlightedRowIdSet.has(row.id);
                  const isSelected = selectedRowIdSet.has(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      tabIndex={0}
                      aria-selected={selectedRow?.id === row.id}
                      onClick={() => onSelectRow(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          onSelectRow(row);
                        }

                        if (event.key === " ") {
                          event.preventDefault();
                          onToggleRowSelection(row.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors duration-150 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
                        isHighlighted && "bg-sky-50/20",
                        isSelected && "bg-sky-50/40",
                        selectedRow?.id === row.id &&
                        "ring-1 ring-inset ring-sky-300"
                      )}
                    >
                      <TableCell className="sticky left-0 z-20 w-[48px] border-r border-border bg-background px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => onToggleRowSelection(row.id)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </TableCell>

                      {visibleColumns.map((column, columnIndex) => {
                        const isValidationField =
                          row.validationField === column.key;

                        const isTransformed =
                          row.transformedFields?.includes(column.key);

                        const isEditing =
                          editingCell?.rowId === row.id &&
                          editingCell.field === column.key;

                        return (
                          <TableCell
                            key={column.key}
                            className={cn(
                              "px-4 py-3 align-middle text-foreground transition-colors hover:bg-muted/30",
                              isTransformed &&
                              "bg-emerald-50/60 ring-1 ring-inset ring-emerald-200",
                              columnIndex === 0 &&
                              "border-l-2 border-l-transparent",
                              columnIndex === 0 &&
                              isHighlighted &&
                              "border-l-sky-500",
                              row.validationState === "missing" &&
                              isValidationField &&
                              "bg-amber-50 text-amber-950",
                              row.validationState === "invalid" &&
                              isValidationField &&
                              "bg-red-50 text-red-950",
                              isHighlighted &&
                              isValidationField &&
                              "ring-1 ring-inset ring-sky-300"
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    value={draftValue}
                                    onChange={(event) =>
                                      onDraftValueChange(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        onSaveEditing();
                                      }

                                      if (event.key === "Escape") {
                                        onCancelEditing();
                                      }
                                    }}
                                    className="h-8 min-w-[180px] rounded-md border border-border bg-background px-2 text-sm outline-none ring-2 ring-primary/20"
                                    aria-label={`Editing ${column.label} for row ${row.id}`}
                                    autoFocus
                                  />

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onMouseDown={(event) =>
                                      event.preventDefault()
                                    }
                                    onClick={onSaveEditing}
                                    aria-label={`Save ${column.label} for row ${row.id}`}
                                  >
                                    Save
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onMouseDown={(event) =>
                                      event.preventDefault()
                                    }
                                    onClick={onCancelEditing}
                                    aria-label={`Cancel editing ${column.label} for row ${row.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onStartEditing(
                                      row.id,
                                      column.key,
                                      row.values[column.key]
                                    );
                                  }}
                                  className="w-full rounded-md px-1 py-0.5 text-left transition-colors hover:bg-background hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  aria-label={`Edit ${column.label} for row ${row.id}`}
                                >
                                  {formatCellValue(row.values[column.key])}
                                </button>
                              )}

                              {isTransformed && (
                                <span className="inline-flex w-fit rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                  Corrected
                                </span>
                              )}

                              {row.validationState === "invalid" &&
                                isValidationField && (
                                  <span className="inline-flex w-fit rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700">
                                    Invalid value
                                  </span>
                                )}
                            </div>
                          </TableCell>
                        );
                      })}

                      <TableCell className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5 text-[13px] font-medium">
                          {row.validationState === "invalid" ? (
                            <>
                              <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                              <span className="text-red-700">
                                Invalid format
                              </span>
                            </>
                          ) : row.validationState === "missing" ? (
                            <>
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                              <span className="text-amber-700">
                                Needs review
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="text-emerald-700">Valid</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row);
                          }}
                          aria-label={`Inspect row ${row.id}`}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}