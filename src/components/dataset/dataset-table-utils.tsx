import { DataGridColumnFilter } from "@/types/data-grid-types";
import { DatasetRow } from "@/types/dataset";

export type DatasetStatusFilter =
  | "all"
  | "valid"
  | "missing"
  | "invalid"
  | "corrected";

export type SortConfig = {
  field: string;
  direction: "asc" | "desc";
} | null;

export type TablePreferences = {
  version: 2;
  rowsPerPage: number;
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  sortConfig: SortConfig;
  columnFilters: DataGridColumnFilter[];
};

export function getTablePreferencesKey(schemaKey: string) {
  return `rowlens-table-preferences:${schemaKey}`;
}

const TABLE_PREFERENCES_VERSION = 2;

const DEFAULT_TABLE_PREFERENCES: TablePreferences = {
  version: TABLE_PREFERENCES_VERSION,
  rowsPerPage: 10,
  searchQuery: "",
  statusFilter: "all",
  sortConfig: null,
  columnFilters: [],
};

const VALID_STATUS_FILTERS: DatasetStatusFilter[] = [
  "all",
  "valid",
  "missing",
  "invalid",
  "corrected",
];

const VALID_ROWS_PER_PAGE = [10, 25, 50];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDatasetStatusFilter(value: unknown): value is DatasetStatusFilter {
  return (
    typeof value === "string" &&
    VALID_STATUS_FILTERS.includes(value as DatasetStatusFilter)
  );
}

function isSortConfig(value: unknown): value is SortConfig {
  if (value === null) return true;
  if (!isRecord(value)) return false;

  return (
    typeof value.field === "string" &&
    (value.direction === "asc" || value.direction === "desc")
  );
}

export function getDefaultTablePreferences() {
  return DEFAULT_TABLE_PREFERENCES;
}

export function parseTablePreferences(value: unknown): TablePreferences | null {
  if (!isRecord(value)) return null;

  if (value.version !== TABLE_PREFERENCES_VERSION) {
    return null;
  }

  if (
    typeof value.rowsPerPage !== "number" ||
    !VALID_ROWS_PER_PAGE.includes(value.rowsPerPage)
  ) {
    return null;
  }

  if (typeof value.searchQuery !== "string") {
    return null;
  }

  if (!isDatasetStatusFilter(value.statusFilter)) {
    return null;
  }

  if (!isSortConfig(value.sortConfig)) {
    return null;
  }

  if (!Array.isArray(value.columnFilters)) {
    return null;
  }

  return {
    version: TABLE_PREFERENCES_VERSION,
    rowsPerPage: value.rowsPerPage,
    searchQuery: value.searchQuery,
    statusFilter: value.statusFilter,
    sortConfig: value.sortConfig,
    columnFilters: value.columnFilters,
  };
}

export function getPersistedPreferences(schemaKey: string): TablePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_TABLE_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(
      getTablePreferencesKey(schemaKey)
    );

    if (!stored) {
      return DEFAULT_TABLE_PREFERENCES;
    }

    const parsed = parseTablePreferences(JSON.parse(stored));

    if (!parsed) {
      localStorage.removeItem(getTablePreferencesKey(schemaKey));
      return DEFAULT_TABLE_PREFERENCES;
    }

    return parsed;
  } catch {
    localStorage.removeItem(getTablePreferencesKey(schemaKey));
    return DEFAULT_TABLE_PREFERENCES;
  }
}

export function persistPreferences(
  schemaKey: string,
  preferences: Omit<TablePreferences, "version">
) {
  if (typeof window === "undefined") return;

  const nextPreferences: TablePreferences = {
    version: TABLE_PREFERENCES_VERSION,
    ...preferences,
  };

  localStorage.setItem(
    getTablePreferencesKey(schemaKey),
    JSON.stringify(nextPreferences)
  );
}

export function formatCellValue(value: DatasetRow["values"][string]) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
        Missing value
      </span>
    );
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return String(value);
}

export function getValidationLabel(state: DatasetRow["validationState"]) {
  if (state === "invalid") return "Invalid";
  if (state === "missing") return "Needs review";
  return "Valid";
}