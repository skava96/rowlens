import { DatasetRow } from "@/types/dataset";
import { MISSING_FILTER_VALUE } from "@/types/data-grid-types";

import { queryDatasetRows } from "../utils/queryDatasetRows";
import { DatasetTableQueryResult } from "../types/table-query";
import { DatasetTableQueryAdapter } from "./table-query-adapter";

type DatasetTableQuery = Parameters<
  DatasetTableQueryAdapter["queryRows"]
>[0]["query"];

function applyColumnFilters(rows: DatasetRow[], query: DatasetTableQuery) {
  if (query.columnFilters.length === 0) return rows;

  return rows.filter((row) =>
    query.columnFilters.every((filter) => {
      if (!filter.columnKey) return true;

      const selectedValues = Array.isArray(filter.values)
        ? filter.values.map((value) => value.toLowerCase())
        : [];

      if (selectedValues.length === 0) return true;

      const rawValue = row.values[filter.columnKey];
      const isMissingValue =
        rawValue === null || rawValue === undefined || rawValue === "";

      if (isMissingValue) {
        return selectedValues.includes(MISSING_FILTER_VALUE);
      }

      const cellValue =
        rawValue instanceof Date
          ? rawValue.toLocaleDateString().toLowerCase()
          : String(rawValue).toLowerCase();

      return selectedValues.includes(cellValue);
    })
  );
}

export const localTableQueryAdapter: DatasetTableQueryAdapter = {
  queryRows({ rows, query }): DatasetTableQueryResult<DatasetRow> {
    const searchedRows = queryDatasetRows({
      rows,
      searchQuery: query.searchQuery,
      statusFilter: query.statusFilter,
      sortConfig: query.sortConfig,
    });

    const filteredRows = applyColumnFilters(searchedRows, query);

    const totalPages = Math.max(
      1,
      Math.ceil(filteredRows.length / query.pageSize)
    );

    const paginatedRows = filteredRows.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize
    );

    return {
      rows: paginatedRows,
      totalRows: filteredRows.length,
      totalPages,
    };
  },

  async queryRowsAsync({ rows, query, signal }) {
    if (signal?.aborted) {
      throw new DOMException("Query was cancelled.", "AbortError");
    }

    return this.queryRows({ rows, query });
  },
};
