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
  rowsPerPage: number;
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  sortConfig: SortConfig;
};

export const TABLE_PREFERENCES_KEY = "cleanflow-table-preferences";

export function getPersistedPreferences(): TablePreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(TABLE_PREFERENCES_KEY);
    return stored ? (JSON.parse(stored) as TablePreferences) : null;
  } catch {
    return null;
  }
}

export function persistPreferences(preferences: TablePreferences) {
  if (typeof window === "undefined") return;

  localStorage.setItem(TABLE_PREFERENCES_KEY, JSON.stringify(preferences));
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