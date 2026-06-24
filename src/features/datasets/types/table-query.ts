import { DatasetStatusFilter, SortConfig } from "@/components/dataset/dataset-table-utils";
import { DataGridColumnFilter } from "@/types/data-grid-types";

export type DatasetTableQuery = {
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  columnFilters: DataGridColumnFilter[];
  sortConfig: SortConfig;
  page: number;
  pageSize: number;
};

export type DatasetTableQueryResult<T> = {
  rows: T[];
  totalRows: number;
  totalPages: number;
};