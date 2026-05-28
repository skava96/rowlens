"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DatasetColumn, DatasetRow } from "@/types/dataset";
import { useDatasetTableState } from "@/features/datasets/hooks/useDatasetTableState";

import { DatasetTableControls } from "./dataset-table-controls";
import { DatasetTableGrid } from "./dataset-table-grid";
import { RowInspector } from "./row-inspector";

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
        filteredRowCount={table.filteredRows.length}
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
        onBulkMarkSelectedRowsValid={table.bulkMarkSelectedRowsValid}
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
              table.setCurrentPage((page) => Math.max(1, page - 1))
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
              table.setCurrentPage((page) =>
                Math.min(table.totalPages, page + 1)
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      {table.selectedRow && (
        <RowInspector
          columns={columns}
          selectedRow={table.selectedRow}
          onClose={table.closeInspector}
        />
      )}
    </div>
  );
}