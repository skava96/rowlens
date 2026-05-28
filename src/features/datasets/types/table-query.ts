import { DatasetStatusFilter, SortConfig } from "@/components/dataset/dataset-table-utils";

export type DatasetTableQuery = {
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  sortConfig: SortConfig;
  page: number;
  pageSize: number;
};

export type DatasetTableQueryResult<T> = {
  rows: T[];
  totalRows: number;
  totalPages: number;
};