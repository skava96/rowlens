"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

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

interface DatasetTableProps {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  highlightedRowIds?: number[];
  onUpdateCell?: (rowId: number, field: string, value: string) => void;
  onExportRows?: (rowIds: number[]) => void;
  onBulkMarkValid?: (rowIds: number[]) => void;
}

type DatasetStatusFilter =
  | "all"
  | "valid"
  | "missing"
  | "invalid"
  | "corrected";

function formatCellValue(value: DatasetRow["values"][string]) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
        Missing value
      </span>
    );
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return String(value);
}

export function DatasetTable({
  columns,
  rows,
  highlightedRowIds = [],
  onUpdateCell,
  onExportRows,
  onBulkMarkValid,
}: DatasetTableProps) {
  const highlightedRowIdSet = useMemo(
    () => new Set(highlightedRowIds),
    [highlightedRowIds]
  );

  const [editingCell, setEditingCell] = useState<{
    rowId: number;
    field: string;
  } | null>(null);

  const [draftValue, setDraftValue] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DatasetStatusFilter>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  const [selectedRow, setSelectedRow] =
    useState<DatasetRow | null>(null);

  const startEditing = (
    rowId: number,
    field: string,
    currentValue: DatasetRow["values"][string]
  ) => {
    setEditingCell({ rowId, field });
    setDraftValue(
      currentValue === null || currentValue === undefined
        ? ""
        : String(currentValue)
    );
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setDraftValue("");
  };

  const saveEditing = () => {
    if (!editingCell) return;

    onUpdateCell?.(editingCell.rowId, editingCell.field, draftValue);

    setEditingCell(null);
    setDraftValue("");
  };

  const toggleSort = (field: string) => {
    setCurrentPage(1);

    setSortConfig((current) => {
      if (!current || current.field !== field) {
        return { field, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { field, direction: "desc" };
      }

      return null;
    });
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchingRows = rows.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ||
        row.validationState === statusFilter ||
        (statusFilter === "corrected" &&
          (row.transformedFields?.length ?? 0) > 0);

      const matchesSearch =
        !normalizedSearch ||
        Object.values(row.values).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      return matchesStatus && matchesSearch;
    });

    if (!sortConfig) {
      return matchingRows;
    }

    return [...matchingRows].sort((a, b) => {
      const aValue =
        sortConfig.field === "__validation"
          ? a.validationState
          : a.values[sortConfig.field];

      const bValue =
        sortConfig.field === "__validation"
          ? b.validationState
          : b.values[sortConfig.field];

      const normalizedA =
        aValue === null || aValue === undefined ? "" : String(aValue);

      const normalizedB =
        bValue === null || bValue === undefined ? "" : String(bValue);

      const comparison = normalizedA.localeCompare(normalizedB, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [rows, searchQuery, statusFilter, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / rowsPerPage)
  );

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const selectedRowIdSet = useMemo(
    () => new Set(selectedRowIds),
    [selectedRowIds]
  );

  const visibleRowIds = paginatedRows.map((row) => row.id);

  const allVisibleRowsSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((rowId) => selectedRowIdSet.has(rowId));

  const toggleRowSelection = (rowId: number) => {
    setSelectedRowIds((current) =>
      current.includes(rowId)
        ? current.filter((id) => id !== rowId)
        : [...current, rowId]
    );
  };

  const toggleVisibleRowsSelection = () => {
    setSelectedRowIds((current) => {
      const currentSet = new Set(current);

      if (allVisibleRowsSelected) {
        visibleRowIds.forEach((rowId) => currentSet.delete(rowId));
      } else {
        visibleRowIds.forEach((rowId) => currentSet.add(rowId));
      }

      return Array.from(currentSet);
    });
  };

  const clearSelection = () => {
    setSelectedRowIds([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">Record Controls</p>
          <p className="text-xs text-muted-foreground">
            Showing {filteredRows.length} of {rows.length} rows
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search records..."
            className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Search dataset records"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as DatasetStatusFilter);
              setCurrentPage(1);
            }}
            className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Filter records by validation status"
          >
            <option value="all">All rows</option>
            <option value="valid">Valid</option>
            <option value="missing">Missing</option>
            <option value="invalid">Invalid</option>
            <option value="corrected">Corrected</option>
          </select>
        </div>
      </div>
      {selectedRowIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-950">
              {selectedRowIds.length} rows selected
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
              onClick={clearSelection}
            >
              Clear selection
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onBulkMarkValid?.(selectedRowIds);
                clearSelection();
              }}
            >
              Mark reviewed
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => onExportRows?.(selectedRowIds)}
            >
              Export selected
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background shadow-sm">
        <Table className="min-w-[900px] text-sm">
          <caption className="sr-only">
            Uploaded dataset records with dynamic columns, validation status,
            editable cells, and highlighted rows for selected AI suggestions.
          </caption>

          <TableHeader className="border-b border-border bg-slate-50">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="sticky left-0 top-0 z-20 w-[48px] bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleRowsSelected}
                  onChange={toggleVisibleRowsSelection}
                  aria-label="Select all visible rows"
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="sticky top-0 z-10 min-w-[180px] px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                    {sortConfig?.field === column.key && (
                      <span aria-hidden="true">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </TableHead>
              ))}

              <TableHead className="sticky top-0 z-10 min-w-[180px] px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => toggleSort("__validation")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                  aria-label="Sort by validation status"
                >
                  Validation
                  {sortConfig?.field === "__validation" && (
                    <span aria-hidden="true">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No records match the current search or filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const isHighlighted = highlightedRowIdSet.has(row.id);

                return (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedRow(row)}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-muted/40",
                      isHighlighted && "bg-sky-50/20",
                      selectedRowIdSet.has(row.id) && "bg-sky-50/40",
                      selectedRow?.id === row.id &&
                      "ring-1 ring-inset ring-sky-300",
                    )}
                  >
                    <TableCell className="sticky left-0 z-10 w-[48px] bg-background px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRowIdSet.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </TableCell>
                    {columns.map((column, columnIndex) => {
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
                                    setDraftValue(event.target.value)
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      saveEditing();
                                    }

                                    if (event.key === "Escape") {
                                      cancelEditing();
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
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={saveEditing}
                                  aria-label={`Save ${column.label} for row ${row.id}`}
                                >
                                  Save
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={cancelEditing}
                                  aria-label={`Cancel editing ${column.label} for row ${row.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(
                                    row.id,
                                    column.key,
                                    row.values[column.key]
                                  )
                                }
                                className="w-full rounded-md text-left hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>

          <select
            value={rowsPerPage}
            onChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>

      {selectedRow && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Row Inspector
              </h2>

              <p className="text-sm text-muted-foreground">
                Detailed dataset record inspection and validation metadata.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRow(null)}
            >
              Close
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {columns.map((column) => (
              <div
                key={column.key}
                className="rounded-xl border border-border bg-muted/20 p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {column.label}
                </p>

                <div className="mt-2 text-sm font-medium text-foreground">
                  {formatCellValue(selectedRow.values[column.key])}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Validation State
            </p>

            <p className="mt-2 text-sm font-medium text-foreground">
              {selectedRow.validationState}
            </p>

            {selectedRow.validationField && (
              <p className="mt-1 text-sm text-muted-foreground">
                Validation issue detected in:
                {" "}
                <span className="font-medium">
                  {selectedRow.validationField}
                </span>
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}