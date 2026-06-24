import { DatasetColumn } from "@/types/dataset";

export const MISSING_FILTER_VALUE = "__cleanflow_missing_value__";

export type DataGridColumnsPanelModel = {
  columnSearchQuery: string;
  filteredVisibilityColumns: DatasetColumn[];
  visibleColumnKeySet: Set<string>;
  activePinnedColumnKeys: string[];
  maxPinnedColumns: number;

  onColumnSearchChange: (value: string) => void;
  onToggleColumnVisibility: (columnKey: string) => void;
  onToggleColumnPin: (columnKey: string) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
};

export type DataGridColumnFilter = {
  columnKey: string;
  operator: "equals";
  values: string[];
};

export type DataGridFiltersPanelModel = {
  filters: DataGridColumnFilter[];
  activeFilterCount: number;

  onAddFilter: () => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (
    index: number,
    updates: Partial<DataGridColumnFilter>
  ) => void;

  clearAllFilters: () => void;
};
