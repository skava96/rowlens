"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatasetColumn, DatasetRow } from "@/types/dataset";

import { DatasetTableControls } from "./dataset-table-controls";
import { DatasetTableGrid } from "./dataset-table-grid";
import { RowInspector } from "./row-inspector";
import {
  DatasetStatusFilter,
  getPersistedPreferences,
  persistPreferences,
  SortConfig,
  TablePreferences,
} from "./dataset-table-utils";

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
  const persistedPreferences = useMemo(() => getPersistedPreferences(), []);

  const [editingCell, setEditingCell] = useState<{
    rowId: number;
    field: string;
  } | null>(null);

  const [draftValue, setDraftValue] = useState("");
  const [searchQuery, setSearchQuery] = useState(
    persistedPreferences?.searchQuery ?? ""
  );
  const [statusFilter, setStatusFilter] = useState<DatasetStatusFilter>(
    persistedPreferences?.statusFilter ?? "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(
    persistedPreferences?.rowsPerPage ?? 10
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    persistedPreferences?.sortConfig ?? null
  );
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [selectedRow, setSelectedRow] = useState<DatasetRow | null>(null);

  const highlightedRowIdSet = useMemo(
    () => new Set(highlightedRowIds),
    [highlightedRowIds]
  );

  const visibleColumns = useMemo(() => {
    if (!visibleColumnKeys?.length) return columns;

    const visibleColumnKeySet = new Set(visibleColumnKeys);
    return columns.filter((column) => visibleColumnKeySet.has(column.key));
  }, [columns, visibleColumnKeys]);

  const saveTablePreferences = (next: Partial<TablePreferences>) => {
    persistPreferences({
      rowsPerPage,
      searchQuery,
      statusFilter,
      sortConfig,
      ...next,
    });
  };

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

  const closeInspector = () => {
    setSelectedRow(null);
  };

  const saveEditing = () => {
    if (!editingCell) return;

    onUpdateCell?.(editingCell.rowId, editingCell.field, draftValue);

    toast.success("Cell updated", {
      description: `Row ${editingCell.rowId} was successfully updated.`,
    });

    setEditingCell(null);
    setDraftValue("");
  };

  const toggleSort = (field: string) => {
    setCurrentPage(1);

    setSortConfig((current) => {
      let nextSortConfig: SortConfig;

      if (!current || current.field !== field) {
        nextSortConfig = { field, direction: "asc" };
      } else if (current.direction === "asc") {
        nextSortConfig = { field, direction: "desc" };
      } else {
        nextSortConfig = null;
      }

      saveTablePreferences({ sortConfig: nextSortConfig });
      return nextSortConfig;
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
          String(value ?? "").toLowerCase().includes(normalizedSearch)
        );

      return matchesStatus && matchesSearch;
    });

    if (!sortConfig) return matchingRows;

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

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

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
    <div
      className="space-y-3"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          cancelEditing();
          closeInspector();
        }
      }}
    >
      <DatasetTableControls
        filteredRowCount={filteredRows.length}
        totalRowCount={rows.length}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={(nextSearchQuery) => {
          setSearchQuery(nextSearchQuery);
          setCurrentPage(1);
          saveTablePreferences({ searchQuery: nextSearchQuery });
        }}
        onStatusFilterChange={(nextStatusFilter) => {
          setStatusFilter(nextStatusFilter);
          setCurrentPage(1);
          saveTablePreferences({ statusFilter: nextStatusFilter });
        }}
      />

      <DatasetTableGrid
        columns={columns}
        rows={paginatedRows}
        visibleColumns={visibleColumns}
        highlightedRowIdSet={highlightedRowIdSet}
        selectedRowIdSet={selectedRowIdSet}
        selectedRow={selectedRow}
        selectedRowIds={selectedRowIds}
        editingCell={editingCell}
        draftValue={draftValue}
        sortConfig={sortConfig}
        allVisibleRowsSelected={allVisibleRowsSelected}
        onToggleSort={toggleSort}
        onToggleVisibleRowsSelection={toggleVisibleRowsSelection}
        onToggleRowSelection={toggleRowSelection}
        onSelectRow={setSelectedRow}
        onStartEditing={startEditing}
        onDraftValueChange={setDraftValue}
        onSaveEditing={saveEditing}
        onCancelEditing={cancelEditing}
        onExportRows={onExportRows}
        onBulkMarkValid={onBulkMarkValid}
        onClearSelection={clearSelection}
      />

      <div className="sticky bottom-0 z-30 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>

          <select
            value={rowsPerPage}
            onChange={(event) => {
              const nextRowsPerPage = Number(event.target.value);

              setRowsPerPage(nextRowsPerPage);
              setCurrentPage(1);
              saveTablePreferences({ rowsPerPage: nextRowsPerPage });
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
        <RowInspector
          columns={columns}
          selectedRow={selectedRow}
          onClose={closeInspector}
        />
      )}
    </div>
  );
}