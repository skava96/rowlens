import { DatasetRow } from "@/types/dataset";

import { queryDatasetRows } from "../utils/queryDatasetRows";
import { DatasetTableQueryResult } from "../types/table-query";
import { DatasetTableQueryAdapter } from "./table-query-adapter";

function applyColumnFilters(rows: DatasetRow[], query: Parameters<DatasetTableQueryAdapter["queryRows"]>[0]["query"]) {
  if (query.columnFilters.length === 0) return rows;

  return rows.filter((row) =>
    query.columnFilters.every((filter) => {
      const selectedValues = Array.isArray(filter.values)
  ? filter.values.map((value) => value.toLowerCase())
  : [];
      if (!filter.columnKey || selectedValues?.length === 0) return true;

      const rawValue = row.values[filter.columnKey];
      const cellValue =
        rawValue === null || rawValue === undefined
          ? ""
          : String(rawValue).toLowerCase();

      if (filter.operator === "equals") {
        return selectedValues?.includes(cellValue);
      }

      if (filter.operator === "startsWith") {
        return selectedValues?.some((v) => cellValue.startsWith(v));
      }

      return selectedValues?.some((v) => cellValue.includes(v));
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