import { DatasetRow } from "@/types/dataset";
import { DatasetStatusFilter, SortConfig } from "@/components/dataset/dataset-table-utils";

type QueryDatasetRowsArgs = {
  rows: DatasetRow[];
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  sortConfig: SortConfig;
};

export function queryDatasetRows({
  rows,
  searchQuery,
  statusFilter,
  sortConfig,
}: QueryDatasetRowsArgs) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const matchingRows = rows.filter((row) => {
    const matchesStatus =
      statusFilter === "all" ||
      row.validationState === statusFilter ||
      (statusFilter === "corrected" &&
        (row.transformedFields?.length ?? 0) > 0);

    const matchesSearch =
      !normalizedSearchQuery ||
      row.searchText?.includes(normalizedSearchQuery);

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
}