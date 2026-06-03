"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DatasetColumn, DatasetRow } from "@/types/dataset";
import { useDatasetTableState } from "@/features/datasets/hooks/useDatasetTableState";

import { DatasetTableControls } from "./dataset-table-controls";
import { DatasetTableGrid } from "./dataset-table-grid";
import { RowInspector } from "./row-inspector";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

interface DatasetTableProps {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  visibleColumnKeys?: string[];
  highlightedRowIds?: number[];
  onUpdateCell?: (rowId: number, field: string, value: string) => void;
  onExportRows?: (rowIds: number[]) => void;
  onBulkMarkValid?: (rowIds: number[]) => void;
}

export function DatasetTable({
  columns,
  rows,
  visibleColumnKeys,
  highlightedRowIds = [],
  onUpdateCell,
  onExportRows,
  onBulkMarkValid,
}: DatasetTableProps) {
  const schemaKey = useMemo(
    () => columns.map((column) => column.key).join("|"),
    [columns]
  );

  const table = useDatasetTableState({
    schemaKey,
    columns,
    rows,
    visibleColumnKeys,
    highlightedRowIds,
    onUpdateCell,
    onExportRows,
    onBulkMarkValid,
  });

  return (
    <div
      className="space-y-3"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          table.cancelEditing();
          table.closeInspector();
        }
      }}
    >
      <DatasetTableControls
        filteredRowCount={table.filteredRowCount}
        totalRowCount={rows.length}
        searchQuery={table.searchQuery}
        statusFilter={table.statusFilter}
        onSearchChange={table.setSearch}
        onStatusFilterChange={table.setStatus}
      />

      <DatasetTableGrid
        columns={columns}
        rows={table.paginatedRows}
        visibleColumns={table.visibleColumns}
        highlightedRowIdSet={table.highlightedRowIdSet}
        selectedRowIdSet={table.selectedRowIdSet}
        selectedRow={table.selectedRow}
        selectedRowIds={table.selectedRowIds}
        editingCell={table.editingCell}
        draftValue={table.draftValue}
        sortConfig={table.sortConfig}
        allVisibleRowsSelected={table.allVisibleRowsSelected}
        hasPartialVisibleSelection={table.hasPartialVisibleSelection}
        onToggleSort={table.toggleSort}
        onToggleVisibleRowsSelection={table.toggleVisibleRowsSelection}
        onToggleRowSelection={table.toggleRowSelection}
        onSelectRow={(row) => table.setSelectedRowId(row.id)}
        onStartEditing={table.startEditing}
        onDraftValueChange={table.setDraftValue}
        onSaveEditing={table.saveEditing}
        onCancelEditing={table.cancelEditing}
        onExportSelectedRows={table.exportSelectedRows}
        onBulkMarkSelectedRowsValid={table.bulkMarkSelectedRowsReviewed}
        onClearSelection={table.clearSelection}
        onResetFilters={table.resetFilters}
        onClearSearch={table.clearSearch}
      />

      <div className="sticky bottom-0 z-30 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>

          <select
            value={table.rowsPerPage}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
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
            disabled={table.currentPage === 1}
            onClick={() =>
              table.setCurrentPage(Math.max(1, table.currentPage - 1))
            }
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {table.currentPage} of {table.totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={table.currentPage === table.totalPages}
            onClick={() =>
              table.setCurrentPage(
                Math.min(table.totalPages, table.currentPage + 1)
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet
        open={!!table.selectedRow}
        onOpenChange={(open) => {
          if (!open) {
            table.closeInspector();
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(92vw,980px)] max-w-none overflow-y-auto p-0 min-w-[750px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              Row Inspector
            </SheetTitle>
          </SheetHeader>

          {table.selectedRow && (
            <RowInspector
              columns={columns}
              selectedRow={table.selectedRow}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}