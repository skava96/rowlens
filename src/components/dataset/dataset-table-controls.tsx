import { DatasetStatusFilter } from "./dataset-table-utils";

interface DatasetTableControlsProps {
  filteredRowCount: number;
  totalRowCount: number;
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: DatasetStatusFilter) => void;
}

export function DatasetTableControls({
  filteredRowCount,
  totalRowCount,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: DatasetTableControlsProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold">Record Controls</p>

        <p className="text-xs text-muted-foreground">
          Showing {filteredRowCount} of {totalRowCount} rows
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Tip: click a row to inspect it, or click a cell value to edit inline.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search records..."
          className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Search dataset records"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as DatasetStatusFilter)
          }
          className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Filter records by validation status"
        >
          <option value="all">All rows</option>
          <option value="valid">Valid</option>
          <option value="missing">Missing</option>
          <option value="invalid">Invalid</option>
          <option value="corrected">Corrected</option>
        </select>
      </div>
    </div>
  );
}