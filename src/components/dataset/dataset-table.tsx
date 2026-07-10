"use client";

import { ReactNode, useMemo, useState } from "react";
import { Columns3, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatasetColumn, DatasetRow } from "@/types/dataset";
import { useDatasetTableState } from "@/features/datasets/hooks/useDatasetTableState";

import { DatasetTableControls } from "./dataset-table-controls";
import { DatasetTableGrid } from "./dataset-table-grid";
import { RowInspector } from "./row-inspector";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import DataGridColumnsPanel from "./data-grid-columns-panel";
import { DataGridFiltersPanel } from "./data-grid-filters-panel";
import { DataGridColumnsPanelModel } from "@/types/data-grid-types";

type ToolPanel = "columns" | "filters" | null;

interface DatasetTableProps {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  visibleColumnKeys?: string[];
  highlightedRowIds?: number[];
  highlightedField?: string;
  pinnedColumnKeys?: string[];
  activeVisibleColumnCount?: number;
  recordsViewSelector?: ReactNode;
  columnsPanel?: DataGridColumnsPanelModel;
  schemaKey?: string;
  onUpdateCell?: (rowId: number, field: string, value: string) => void;
  onExportRows?: (rowIds: number[]) => void;
  onBulkMarkValid?: (rowIds: number[]) => void;
}

export function DatasetTable({
  columns,
  rows,
  visibleColumnKeys,
  highlightedRowIds = [],
  highlightedField,
  pinnedColumnKeys = [],
  activeVisibleColumnCount,
  recordsViewSelector,
  columnsPanel,
  schemaKey: providedSchemaKey,
  onUpdateCell,
  onExportRows,
  onBulkMarkValid,
}: DatasetTableProps) {

  const [activeToolPanel, setActiveToolPanel] = useState<ToolPanel>(null);

  const toggleToolPanel = (panel: "columns" | "filters") => {
    setActiveToolPanel((current) => (current === panel ? null : panel));
  };
  const schemaKey = useMemo(
    () => columns.map((column) => column.key).join("|"),
    [columns]
  );

  const table = useDatasetTableState({
    schemaKey: providedSchemaKey ?? schemaKey,
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
      <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex min-w-fit items-center">
          {recordsViewSelector}
        </div>

        <p className="justify-self-start text-xs text-muted-foreground">
          {table.filteredRowCount} rows •{" "}
          {activeVisibleColumnCount ?? table.visibleColumns.length} columns
        </p>

        <div className="flex items-center gap-2 justify-self-end">
          {columnsPanel && (
            <Button
              type="button"
              variant={activeToolPanel === "columns" ? "default" : "outline"}
              size="sm"
              onClick={() => toggleToolPanel("columns")}
            >
              <Columns3 className="mr-2 h-4 w-4" />
              Columns
            </Button>
          )}

          <Button
            type="button"
            variant={activeToolPanel === "filters" ? "default" : "outline"}
            size="sm"
            onClick={() => toggleToolPanel("filters")}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>

          <DatasetTableControls
            searchQuery={table.searchQuery}
            statusFilter={table.statusFilter}
            onSearchChange={table.setSearch}
            onStatusFilterChange={table.setStatus}
          />
        </div>
      </div>

      <div
        className={
          activeToolPanel
            ? "grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"
            : "grid gap-3"
        }
      >
        <DatasetTableGrid
          rows={table.paginatedRows}
          visibleColumns={table.visibleColumns}
          highlightedRowIdSet={table.highlightedRowIdSet}
          highlightedField={highlightedField}
          selectedRowIdSet={table.selectedRowIdSet}
          selectedRow={table.selectedRow}
          selectedRowIds={table.selectedRowIds}
          editingCell={table.editingCell}
          draftValue={table.draftValue}
          sortConfig={table.sortConfig}
          allVisibleRowsSelected={table.allVisibleRowsSelected}
          hasPartialVisibleSelection={table.hasPartialVisibleSelection}
          pinnedColumnKeys={pinnedColumnKeys}
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

        {activeToolPanel && (
          <aside className="rounded-2xl border border-border bg-background p-3 shadow-sm">
            {activeToolPanel === "columns" && columnsPanel ? (
              <DataGridColumnsPanel columnsPanel={columnsPanel} />
            ) : (
              <DataGridFiltersPanel
                columns={columns}
                rows={rows}
                filtersPanel={{
                  filters: table.columnFilters,
                  activeFilterCount: table.columnFilters.filter(
                    (filter) =>
                      filter.columnKey &&
                      Array.isArray(filter.values) &&
                      filter.values.length > 0
                  ).length,
                  onAddFilter: table.addColumnFilter,
                  onRemoveFilter: table.removeColumnFilter,
                  onUpdateFilter: table.updateColumnFilter,
                  clearAllFilters: table.clearAllFilters,
                }}
              />
            )}
          </aside>
        )}
      </div>

      <div className="relative bottom-0 z-30 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
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
          className="w-[min(92vw,980px)] max-w-none overflow-y-auto p-0 sm:min-w-[750px]"
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
