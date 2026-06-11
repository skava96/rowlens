import { DatasetStatusFilter } from "./dataset-table-utils";

interface DatasetTableControlsProps {
  searchQuery: string;
  statusFilter: DatasetStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: DatasetStatusFilter) => void;
}

export function DatasetTableControls({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: DatasetTableControlsProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search records..."
          className="h-9 w-[280px] rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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