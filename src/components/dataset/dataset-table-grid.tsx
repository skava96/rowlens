import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Eye,
  XCircle,
} from "lucide-react";

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
  pinnedColumnKeys: string[];
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

const SELECT_COLUMN_WIDTH = 72;
const STATUS_COLUMN_WIDTH = 128;
const PINNED_COLUMN_WIDTH = 180;
const VIEW_COLUMN_WIDTH = 90;

const STATUS_LEFT = SELECT_COLUMN_WIDTH;
const PINNED_START_LEFT = SELECT_COLUMN_WIDTH + STATUS_COLUMN_WIDTH + 16;

function getPinnedColumnLeft(index: number) {
  return PINNED_START_LEFT + index * PINNED_COLUMN_WIDTH;
}

function ValidationStatusCell({ row }: { row: DatasetRow }) {
  return (
    <div className="w-[112px]">
      <div className="flex items-center gap-1.5 text-[13px] font-medium">
        {row.validationState === "invalid" ? (
          <>
            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="truncate text-red-700">Invalid</span>
          </>
        ) : row.validationState === "missing" ? (
          <>
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="truncate text-amber-700">Needs review</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate text-emerald-700">Valid</span>
          </>
        )}
      </div>

      {row.reviewState === "reviewed" && (
        <span className="mt-1 inline-flex w-fit rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-700">
          Reviewed
        </span>
      )}
    </div>
  );
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
  pinnedColumnKeys,
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
  const pinnedDataColumns = visibleColumns.filter((column) =>
    pinnedColumnKeys.includes(column.key)
  );

  const scrollableColumns = visibleColumns.filter(
    (column) => !pinnedColumnKeys.includes(column.key)
  );

  const pinnedColumnCount = pinnedDataColumns.length;

  const tableMinWidth = 2350;

  const lastPinnedColumnIndex = pinnedColumnCount - 1;

  const getAriaSort = (field: string) => {
    if (sortConfig?.field !== field) return "none";
    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  const renderDataCellContent = (row: DatasetRow, column: DatasetColumn) => {
    const isEditing =
      editingCell?.rowId === row.id && editingCell.field === column.key;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            value={draftValue}
            onChange={(event) => onDraftValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSaveEditing();
              if (event.key === "Escape") onCancelEditing();
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
            onClick={onSaveEditing}
            aria-label={`Save ${column.label} for row ${row.id}`}
          >
            Save
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onCancelEditing}
            aria-label={`Cancel editing ${column.label} for row ${row.id}`}
          >
            Cancel
          </Button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onStartEditing(row.id, column.key, row.values[column.key]);
        }}
        className="w-full rounded-md px-1 py-0.5 text-left transition-colors hover:bg-background hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label={`Edit ${column.label} for row ${row.id}`}
      >
        {formatCellValue(row.values[column.key])}
      </button>
    );
  };

  const renderDataCell = (
    row: DatasetRow,
    column: DatasetColumn,
    options?: {
      isPinnedColumn?: boolean;
      isLastPinnedColumn?: boolean;
      isFirstScrollableColumn?: boolean;
      pinnedCellBackground?: string;
      left?: number;
    }
  ) => {
    const isHighlighted = highlightedRowIdSet.has(row.id);
    const isValidationField = row.validationField === column.key;
    const isValueTransformed = row.transformedFields?.includes(column.key);

    const isReviewedOnly =
      row.reviewState === "reviewed" &&
      row.validationField === column.key &&
      !isValueTransformed;

    return (
      <TableCell
        key={column.key}
        className={cn(
          "min-w-[180px] border-b border-slate-300 px-4 py-3 align-middle text-foreground transition-colors hover:bg-muted",
          options?.isPinnedColumn &&
            "sticky z-[70] w-[180px] min-w-[180px]",
          options?.isLastPinnedColumn &&
            "border-r border-r-sky-300 shadow-[4px_0_8px_rgba(0,0,0,0.08)]",
          options?.isPinnedColumn && options.pinnedCellBackground,
          options?.isFirstScrollableColumn &&
            isHighlighted &&
            "border-l-4 border-l-sky-500",
          isValueTransformed &&
            "bg-emerald-50/60 ring-1 ring-inset ring-emerald-200",
          isReviewedOnly && "bg-sky-50/60 ring-1 ring-inset ring-sky-200",
          row.validationState === "missing" &&
            isValidationField &&
            "bg-amber-50 text-amber-950",
          row.validationState === "invalid" &&
            isValidationField &&
            "bg-red-50 text-red-950",
          isHighlighted && isValidationField && "ring-2 ring-inset ring-sky-300"
        )}
        style={options?.isPinnedColumn ? { left: options.left } : undefined}
      >
        <div className="flex flex-col gap-1">
          {renderDataCellContent(row, column)}

          {isValueTransformed && (
            <span className="inline-flex w-fit rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
              Corrected
            </span>
          )}

          {isReviewedOnly && (
            <span className="inline-flex w-fit rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-700">
              Reviewed
            </span>
          )}

          {row.validationState === "invalid" && isValidationField && (
            <span className="inline-flex w-fit rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700">
              Invalid value
            </span>
          )}
        </div>
      </TableCell>
    );
  };

  return (
    <>
      {selectedRowIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-950">
              {selectedRowIds.length} rows selected on this page.
            </p>

            <p className="text-xs text-sky-800">
              Bulk actions apply only to selected rows on the current page.
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
        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
          <Table
            className="border-separate border-spacing-0 text-sm"
            style={{ minWidth: tableMinWidth }}
          >
            <caption className="sr-only">
              Uploaded dataset records with dynamic columns, validation status,
              editable cells, and highlighted rows for selected AI suggestions.
            </caption>

            <TableHeader className="sticky top-0 z-[80] bg-slate-300 shadow-sm">
              <TableRow className="border-b border-slate-300 hover:bg-transparent">
                <TableHead
                  className="sticky left-0 top-0 z-[80] w-[72px] min-w-[72px] border-r border-slate-300 bg-slate-100 px-3 py-3 text-center"
                  style={{ width: SELECT_COLUMN_WIDTH }}
                >
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
                      hasPartialVisibleSelection
                        ? "mixed"
                        : allVisibleRowsSelected
                    }
                  />
                </TableHead>

                <TableHead
                  aria-sort={getAriaSort("__validation")}
                  className="sticky top-0 z-[80] w-[128px] min-w-[128px] bg-slate-100 px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground"
                  style={{ left: STATUS_LEFT, width: STATUS_COLUMN_WIDTH }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleSort("__validation")}
                    className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                    aria-label="Sort by validation status"
                  >
                    Status
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

                {pinnedDataColumns.map((column, index) => {
                  const left = getPinnedColumnLeft(index);
                  const isLastPinnedColumn = index === lastPinnedColumnIndex;

                  return (
                    <TableHead
                      key={column.key}
                      aria-sort={getAriaSort(column.key)}
                      className={cn(
                        "sticky top-0 z-[80] w-[180px] min-w-[180px] bg-slate-100 px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground",
                        isLastPinnedColumn &&
                          "border-r border-r-sky-300 shadow-[4px_0_8px_rgba(0,0,0,0.08)]"
                      )}
                      style={{ left, width: PINNED_COLUMN_WIDTH }}
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
                  );
                })}

                {scrollableColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={getAriaSort(column.key)}
                    className="sticky top-0 z-[70] min-w-[180px] bg-slate-100 px-4 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground"
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
                  className="sticky right-0 top-0 z-[80] w-[90px] min-w-[90px] border-l border-slate-300 bg-slate-100 px-3 py-3 text-center text-xs font-semibold tracking-[0.14em] text-muted-foreground"
                  style={{ width: VIEW_COLUMN_WIDTH }}
                >
                  <span className="block text-center">View</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      scrollableColumns.length + pinnedDataColumns.length + 3
                    }
                    className="border-b border-slate-300 px-4 py-10 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="rounded-full border border-border bg-muted/30 p-3">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <p className="mt-2 text-sm font-semibold text-foreground">
                        No matching records found
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting filters or clearing the current search query.
                      </p>

                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onResetFilters}
                        >
                          Reset filters
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={onClearSearch}
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
                  const isActiveRow = selectedRow?.id === row.id;

                  const pinnedCellBackground = cn(
                    "bg-background",
                    isHighlighted && "bg-sky-50",
                    isSelected && "bg-sky-50"
                  );

                  return (
                    <TableRow
                      key={row.id}
                      tabIndex={0}
                      aria-selected={isActiveRow}
                      onClick={() => onSelectRow(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") onSelectRow(row);

                        if (event.key === " ") {
                          event.preventDefault();
                          onToggleRowSelection(row.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer relative z-[60] border-b border-slate-300 transition-colors duration-150 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
                        isHighlighted && "bg-sky-50",
                        isSelected && "bg-sky-50/40",
                        isActiveRow && "ring-1 ring-inset ring-sky-300"
                      )}
                    >
                      <TableCell
                        className={cn(
                          "sticky left-0 z-[70] w-[72px] min-w-[72px] border-b border-r border-slate-300 px-3 py-3 text-center align-middle",
                          pinnedCellBackground
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => onToggleRowSelection(row.id)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </TableCell>

                      <TableCell
                        className={cn(
                          "sticky z-[70] w-[128px] min-w-[128px] border-b px-4 py-3 align-middle",
                          pinnedCellBackground
                        )}
                        style={{ left: STATUS_LEFT }}
                      >
                        <ValidationStatusCell row={row} />
                      </TableCell>

                      {pinnedDataColumns.map((column, index) =>
                        renderDataCell(row, column, {
                          isPinnedColumn: true,
                          isLastPinnedColumn: index === lastPinnedColumnIndex,
                          pinnedCellBackground,
                          left: getPinnedColumnLeft(index),
                        })
                      )}

                      {scrollableColumns.map((column, columnIndex) =>
                        renderDataCell(row, column, {
                          isFirstScrollableColumn: columnIndex === 0,
                        })
                      )}

                      <TableCell
                        className={cn(
                          "sticky right-0 z-[70] w-[90px] min-w-[90px] border-b border-l border-slate-300 px-3 py-3 text-center align-middle",
                          pinnedCellBackground
                        )}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row);
                          }}
                          aria-label={`Inspect row ${row.id}`}
                        >
                          <Eye className="h-4 w-4" />
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
