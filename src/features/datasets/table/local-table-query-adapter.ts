import { DatasetRow } from "@/types/dataset";

import { queryDatasetRows } from "../utils/queryDatasetRows";
import { DatasetTableQueryResult } from "../types/table-query";
import { DatasetTableQueryAdapter } from "./table-query-adapter";

export const localTableQueryAdapter: DatasetTableQueryAdapter = {
  queryRows({ rows, query }): DatasetTableQueryResult<DatasetRow> {
    const filteredRows = queryDatasetRows({
      rows,
      searchQuery: query.searchQuery,
      statusFilter: query.statusFilter,
      sortConfig: query.sortConfig,
    });

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