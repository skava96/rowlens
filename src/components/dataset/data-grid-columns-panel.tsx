import { Pin } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { DataGridColumnsPanelModel } from "@/types/data-grid-types";

type DataGridColumnsPanelProps = {
    columnsPanel: DataGridColumnsPanelModel;
};

export default function DataGridColumnsPanel({ columnsPanel }: DataGridColumnsPanelProps) {
    return (<div className="flex h-full min-h-[420px] flex-col">
        <div className="pb-3">
            <p className="text-sm font-semibold">Columns</p>
            <p className="mt-1 text-xs text-muted-foreground">
                Manage visibility and pinned columns.
            </p>
        </div>

        <input
            value={columnsPanel.columnSearchQuery ?? ""}
            onChange={(event) =>
                columnsPanel.onColumnSearchChange(event.target.value)
            }
            placeholder="Search columns..."
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Search columns"
        />

        <div className="mt-3 flex items-center justify-between border-b border-border pb-3">
            <p className="text-xs text-muted-foreground">
                {columnsPanel.visibleColumnKeySet.size ?? 0} visible -{" "}
                {columnsPanel.activePinnedColumnKeys.length
                    ? `${columnsPanel.activePinnedColumnKeys.length}/${columnsPanel.maxPinnedColumns} pinned`
                    : `pin up to ${columnsPanel.maxPinnedColumns ?? 2}`}
            </p>

            <div className="flex gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={columnsPanel.onShowAllColumns}
                >
                    Show all
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={columnsPanel.onHideAllColumns}
                >
                    Hide others
                </Button>
            </div>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto pr-1">
            <div className="space-y-1">
                {columnsPanel.filteredVisibilityColumns.map((column) => {
                    const isVisible = columnsPanel.visibleColumnKeySet.has(column.key);
                    const isPinned = columnsPanel.activePinnedColumnKeys.includes(column.key);

                    const pinLimitReached =
                        !isPinned &&
                        columnsPanel.activePinnedColumnKeys.length >=
                        columnsPanel.maxPinnedColumns;

                    const pinDisabled = !isVisible || pinLimitReached;

                    return (
                        <div
                            key={column.key}
                            className={cn(
                                "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60",
                                isPinned && "bg-sky-50 text-sky-950",
                                !isVisible && "text-muted-foreground"
                            )}
                        >
                            <label className="flex min-w-0 items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isVisible}
                                    onChange={() =>
                                        columnsPanel.onToggleColumnVisibility(column.key)
                                    }
                                    disabled={
                                        isVisible &&
                                        columnsPanel.visibleColumnKeySet.size <= 1
                                    }
                                    className="h-4 w-4"
                                />

                                <span className="truncate">{column.label}</span>
                            </label>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={pinDisabled}
                                onClick={() => columnsPanel.onToggleColumnPin(column.key)}
                                className="h-7 w-7 shrink-0"
                                aria-label={`${isPinned ? "Unpin" : "Pin"} ${column.label}`}
                                title={
                                    !isVisible
                                        ? "Show column before pinning"
                                        : pinLimitReached
                                            ? `Maximum ${columnsPanel.maxPinnedColumns} pinned columns`
                                            : isPinned
                                                ? "Unpin column"
                                                : "Pin column"
                                }
                            >
                                <Pin
                                    className={cn(
                                        "h-4 w-4",
                                        isPinned
                                            ? "fill-current text-sky-700"
                                            : "text-muted-foreground"
                                    )}
                                />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>);
}
