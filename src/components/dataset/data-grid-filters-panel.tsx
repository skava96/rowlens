import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatasetColumn, DatasetRow } from "@/types/dataset";
import { DataGridFiltersPanelModel } from "@/types/data-grid-types";
import { cn } from "@/lib/utils";

type DataGridFiltersPanelProps = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  filtersPanel: DataGridFiltersPanelModel;
};

function formatFilterValue(value: DatasetRow["values"][string]) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toLocaleDateString();

  return String(value);
}

function sortDistinctValues(values: string[]) {
  return values.sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

export function DataGridFiltersPanel({
  columns,
  rows,
  filtersPanel,
}: DataGridFiltersPanelProps) {
  const hasFilters = filtersPanel.filters.length > 0;

  const [openValueFilterIndex, setOpenValueFilterIndex] = useState<number | null>(
    null
  );

  const [valueSearchQueryByFilterIndex, setValueSearchQueryByFilterIndex] =
    useState<Record<number, string>>({});

  const distinctValuesByColumn = useMemo(() => {
    const valueMap = new Map<string, string[]>();

    columns.forEach((column) => {
      const values = new Set<string>();

      rows.forEach((row) => {
        const value = formatFilterValue(row.values[column.key]);

        if (value) {
          values.add(value);
        }
      });

      valueMap.set(column.key, sortDistinctValues(Array.from(values)));
    });

    return valueMap;
  }, [columns, rows]);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="pb-3">
        <p className="text-sm font-semibold">Filters</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Filter rows by selected column values.
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-xs text-muted-foreground">
          {filtersPanel.activeFilterCount} active
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={filtersPanel.clearAllFilters}
          disabled={filtersPanel.activeFilterCount === 0}
        >
          Clear all
        </Button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {hasFilters ? (
          <div className="space-y-3">
            {filtersPanel.filters.map((filter, index) => {
              const selectedColumn = columns.find(
                (column) => column.key === filter.columnKey
              );

              const selectedValues = Array.isArray(filter.values)
                ? filter.values
                : [];

              const filterValues = filter.columnKey
                ? distinctValuesByColumn.get(filter.columnKey) ?? []
                : [];

              const valueSearchQuery =
                valueSearchQueryByFilterIndex[index] ?? "";

              const visibleFilterValues = filterValues.filter((value) =>
                value
                  .toLowerCase()
                  .includes(valueSearchQuery.trim().toLowerCase())
              );

              const isValueListOpen = openValueFilterIndex === index;
              const hasSelectedValues = selectedValues.length > 0;

              const allFilterValuesSelected =
                filterValues.length > 0 &&
                filterValues.every((value) => selectedValues.includes(value));

              const allVisibleValuesSelected =
                visibleFilterValues.length > 0 &&
                visibleFilterValues.every((value) =>
                  selectedValues.includes(value)
                );

              const toggleSelectedValue = (value: string) => {
                const nextValues = selectedValues.includes(value)
                  ? selectedValues.filter((item) => item !== value)
                  : [...selectedValues, value];

                filtersPanel.onUpdateFilter(index, {
                  operator: "equals",
                  values: nextValues,
                });
              };

              const toggleVisibleValues = () => {
                const nextValues = allVisibleValuesSelected
                  ? selectedValues.filter(
                      (value) => !visibleFilterValues.includes(value)
                    )
                  : Array.from(
                      new Set([...selectedValues, ...visibleFilterValues])
                    );

                filtersPanel.onUpdateFilter(index, {
                  operator: "equals",
                  values: nextValues,
                });
              };

              return (
                <div
                  key={`${filter.columnKey || "new"}-${index}`}
                  className="space-y-2 rounded-lg border border-border bg-muted/20 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">
                      {selectedColumn?.label ?? "New filter"}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => filtersPanel.onRemoveFilter(index)}
                      className="h-7 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>

                  <select
                    value={filter.columnKey}
                    onChange={(event) => {
                      filtersPanel.onUpdateFilter(index, {
                        columnKey: event.target.value,
                        operator: "equals",
                        values: [],
                      });

                      setOpenValueFilterIndex(null);
                      setValueSearchQueryByFilterIndex((current) => ({
                        ...current,
                        [index]: "",
                      }));
                    }}
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                    aria-label="Select filter column"
                  >
                    <option value="">Select column</option>

                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!filter.columnKey}
                    onClick={() =>
                      filter.columnKey &&
                      setOpenValueFilterIndex((current) =>
                        current === index ? null : index
                      )
                    }
                    className="h-8 w-full justify-between px-2 text-sm font-normal"
                    aria-label="Toggle filter values"
                  >
                    <span className="truncate">
                      {hasSelectedValues
                        ? allFilterValuesSelected
                          ? "All values"
                          : `${selectedValues.length} selected`
                        : "Select values"}
                    </span>

                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isValueListOpen && "rotate-180"
                      )}
                    />
                  </Button>

                  {isValueListOpen && (
                    <div className="space-y-2 rounded-md border border-border bg-background p-2">
                      <input
                        value={valueSearchQuery}
                        onChange={(event) =>
                          setValueSearchQueryByFilterIndex((current) => ({
                            ...current,
                            [index]: event.target.value,
                          }))
                        }
                        placeholder="Search value..."
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Search filter values"
                      />

                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <button
                          type="button"
                          disabled={visibleFilterValues.length === 0}
                          onClick={toggleVisibleValues}
                          className="text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {allVisibleValuesSelected
                            ? "Clear visible"
                            : "Select visible"}
                        </button>

                        <button
                          type="button"
                          disabled={!hasSelectedValues}
                          onClick={() =>
                            filtersPanel.onUpdateFilter(index, {
                              operator: "equals",
                              values: [],
                            })
                          }
                          className="text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Clear selected
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto">
                        {visibleFilterValues.length ? (
                          visibleFilterValues.map((value) => {
                            const isSelected = selectedValues.includes(value);

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleSelectedValue(value)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                                  isSelected && "bg-sky-50 text-sky-900"
                                )}
                              >
                                <span className="truncate">{value}</span>

                                {isSelected && (
                                  <Check className="h-4 w-4 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                            No values found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm font-medium">No filters applied</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a filter to narrow visible rows.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={filtersPanel.onAddFilter}
          className="w-full"
        >
          Add filter
        </Button>
      </div>
    </div>
  );
}