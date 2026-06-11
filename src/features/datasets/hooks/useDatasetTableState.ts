"use client";

import { useCallback, useDeferredValue } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DatasetColumn, DatasetRow } from "@/types/dataset";
import {
    DatasetStatusFilter,
    getPersistedPreferences,
    persistPreferences,
    SortConfig,
    TablePreferences,
} from "@/components/dataset/dataset-table-utils";

import { DatasetTableQuery } from "../types/table-query";
import { DatasetTableRenderState } from "../types/table-rendering";
import { localTableQueryAdapter } from "../table/local-table-query-adapter";
import { DataGridColumnFilter } from "@/types/data-grid-types";

interface UseDatasetTableStateArgs {
    schemaKey: string;
    columns: DatasetColumn[];
    rows: DatasetRow[];
    visibleColumnKeys?: string[];
    highlightedRowIds?: number[];
    onUpdateCell?: (rowId: number, field: string, value: string) => void;
    onExportRows?: (rowIds: number[]) => void;
    onBulkMarkValid?: (rowIds: number[]) => void;
}

export function useDatasetTableState({
    schemaKey,
    columns,
    rows,
    visibleColumnKeys,
    highlightedRowIds = [],
    onUpdateCell,
    onExportRows,
    onBulkMarkValid,
}: UseDatasetTableStateArgs) {
    const persistedPreferences = useMemo(
        () => getPersistedPreferences(schemaKey),
        [schemaKey]
    );

    const [editingCell, setEditingCell] = useState<{
        rowId: number;
        field: string;
    } | null>(null);

    const [draftValue, setDraftValue] = useState("");
    const [searchQuery, setSearchQuery] = useState(
        persistedPreferences.searchQuery
    );

    const [columnFilters, setColumnFilters] = useState(
        persistedPreferences.columnFilters
    );

    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [statusFilter, setStatusFilter] = useState<DatasetStatusFilter>(
        persistedPreferences.statusFilter
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(
        persistedPreferences.rowsPerPage
    );
    const [sortConfig, setSortConfig] = useState<SortConfig>(
        persistedPreferences.sortConfig
    );
    const [selectedRowIdSet, setSelectedRowIdSet] = useState<Set<number>>(
        () => new Set()
    );
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

    const highlightedRowIdSet = useMemo(
        () => new Set(highlightedRowIds),
        [highlightedRowIds]
    );

    const visibleColumns = useMemo(() => {
        if (visibleColumnKeys == null) {
            return columns;
        }

        const visibleColumnKeySet = new Set(visibleColumnKeys);

        return columns.filter((column) => visibleColumnKeySet.has(column.key));
    }, [columns, visibleColumnKeys]);

    const selectedRow = useMemo(
        () => rows.find((row) => row.id === selectedRowId) ?? null,
        [rows, selectedRowId]
    );


    const tableQuery: DatasetTableQuery = useMemo(
        () => ({
            searchQuery: deferredSearchQuery,
            statusFilter,
            sortConfig,
            page: currentPage,
            pageSize: rowsPerPage,
            columnFilters,
        }),
        [deferredSearchQuery, statusFilter, sortConfig, currentPage, rowsPerPage, columnFilters]
    );

    const saveTablePreferences = useCallback(
        (next: Partial<TablePreferences>) => {
            persistPreferences(schemaKey, {
                rowsPerPage,
                searchQuery,
                statusFilter,
                sortConfig,
                columnFilters,
                ...next,
            });
        },
        [
            schemaKey,
            rowsPerPage,
            searchQuery,
            statusFilter,
            sortConfig,
            columnFilters,
        ]
    );

    const clearSelectionState = () => {
        setSelectedRowIdSet(new Set());
        setSelectedRowId(null);
    };

    const setSearch = (nextSearchQuery: string) => {
        setSearchQuery(nextSearchQuery);
        setCurrentPage(1);
        clearSelectionState();
        saveTablePreferences({ searchQuery: nextSearchQuery });
    };

    const setStatus = (nextStatusFilter: DatasetStatusFilter) => {
        setStatusFilter(nextStatusFilter);
        setCurrentPage(1);
        clearSelectionState();
        saveTablePreferences({ statusFilter: nextStatusFilter });
    };

    const setPageSize = (nextRowsPerPage: number) => {
        setRowsPerPage(nextRowsPerPage);
        setCurrentPage(1);
        clearSelectionState();
        saveTablePreferences({ rowsPerPage: nextRowsPerPage });
    };

    const toggleSort = (field: string) => {
        setCurrentPage(1);
        clearSelectionState();

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

    const tableQueryResult = useMemo(
        () =>
            localTableQueryAdapter.queryRows({
                rows,
                query: tableQuery,
            }),
        [rows, tableQuery]
    );

    const paginatedRows = tableQueryResult.rows;
    const totalPages = tableQueryResult.totalPages;
    const filteredRowCount = tableQueryResult.totalRows;

    const tableRenderState: DatasetTableRenderState = {
        mode: "paginated",
        totalRows: filteredRowCount,
        renderedRows: paginatedRows.length,
        virtualizationReady: filteredRowCount > 500,
    };

    const visibleRowIds = paginatedRows.map((row) => row.id);

    const selectedRowIds = useMemo(
        () => visibleRowIds.filter((rowId) => selectedRowIdSet.has(rowId)),
        [visibleRowIds, selectedRowIdSet]
    );

    const allVisibleRowsSelected =
        visibleRowIds.length > 0 &&
        visibleRowIds.every((rowId) => selectedRowIdSet.has(rowId));

    const hasPartialVisibleSelection =
        visibleRowIds.some((rowId) => selectedRowIdSet.has(rowId)) &&
        !allVisibleRowsSelected;

    const toggleRowSelection = (rowId: number) => {
        setSelectedRowIdSet((current) => {
            const next = new Set(current);

            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }

            return next;
        });
    };

    const toggleVisibleRowsSelection = () => {
        setSelectedRowIdSet((current) => {
            const next = new Set(current);

            if (allVisibleRowsSelected) {
                visibleRowIds.forEach((rowId) => next.delete(rowId));
            } else {
                visibleRowIds.forEach((rowId) => next.add(rowId));
            }

            return next;
        });
    };

    const clearSelection = () => {
        setSelectedRowIdSet(new Set());
    };

    const resetFilters = () => {
        setStatusFilter("all");
        setSearchQuery("");
        setCurrentPage(1);

        saveTablePreferences({
            searchQuery: "",
            statusFilter: "all",
        });
        clearSelectionState();
    };

    const clearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);

        saveTablePreferences({
            searchQuery: "",
        });
        clearSelectionState();
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

    const saveEditing = () => {
        if (!editingCell) return;

        onUpdateCell?.(editingCell.rowId, editingCell.field, draftValue);

        toast.success("Cell updated", {
            description: `Row ${editingCell.rowId} was successfully updated.`,
        });

        setEditingCell(null);
        setDraftValue("");
    };

    const closeInspector = () => {
        setSelectedRowId(null);
    };

    const exportSelectedRows = () => {
        const rowIds = visibleRowIds.filter((rowId) => selectedRowIdSet.has(rowId));

        try {
            onExportRows?.(rowIds);
            toast.success("Export started", {
                description: `${rowIds.length} selected rows exported successfully.`,
            });
        } catch {
            toast.error("Export failed", {
                description: "Selected rows could not be exported.",
            });
        }
    };

    const bulkMarkSelectedRowsReviewed = () => {
        const rowIds = visibleRowIds.filter((rowId) => selectedRowIdSet.has(rowId));

        onBulkMarkValid?.(rowIds);

        toast.success("Rows reviewed", {
            description: `${rowIds.length} rows marked as reviewed.`,
        });

        clearSelection();
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
        clearSelectionState();
    };

    const addColumnFilter = () => {
        const nextFilters = [
            ...columnFilters,
            {
                columnKey: "",
                operator: "equals" as const,
                values: [],
            },
        ];

        setColumnFilters(nextFilters);
        saveTablePreferences({ columnFilters: nextFilters });
    };
    const removeColumnFilter = (index: number) => {
        const nextFilters = columnFilters.filter(
            (_, filterIndex) => filterIndex !== index
        );

        setColumnFilters(nextFilters);

        saveTablePreferences({
            columnFilters: nextFilters,
        });
    };

    const updateColumnFilter = (
        index: number,
        updates: Partial<DataGridColumnFilter>
    ) => {
        const nextFilters = columnFilters.map(
            (filter, filterIndex) =>
                filterIndex === index
                    ? { ...filter, ...updates }
                    : filter
        );

        setColumnFilters(nextFilters);

        saveTablePreferences({
            columnFilters: nextFilters,
        });
    };

    const clearAllFilters = () => {
        setColumnFilters([]);

        saveTablePreferences({
            columnFilters: [],
        });
    };

    return {
        searchQuery,
        statusFilter,
        currentPage,
        rowsPerPage,
        sortConfig,
        editingCell,
        draftValue,
        selectedRow,
        selectedRowIds,
        selectedRowIdSet,
        highlightedRowIdSet,
        visibleColumns,
        filteredRows: paginatedRows,
        filteredRowCount,
        paginatedRows,
        totalPages,
        allVisibleRowsSelected,
        hasPartialVisibleSelection,
        tableQuery,
        tableRenderState,
        columnFilters,

        addColumnFilter,
        removeColumnFilter,
        updateColumnFilter,
        clearAllFilters,
        setSearch,
        setStatus,
        setPageSize,
        setCurrentPage: goToPage,
        setSelectedRowId,
        setDraftValue,
        toggleSort,
        toggleRowSelection,
        toggleVisibleRowsSelection,
        clearSelection,
        startEditing,
        cancelEditing,
        saveEditing,
        closeInspector,
        exportSelectedRows,
        bulkMarkSelectedRowsReviewed,
        resetFilters,
        clearSearch,
    };
}