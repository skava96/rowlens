import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ShieldCheck,
  UserPen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatasetTransformation } from "@/features/datasets/types/transformation";
import { DatasetColumn } from "@/types/dataset";
import { cn } from "@/lib/utils";

type Props = {
  transformations: DatasetTransformation[];
  columns: DatasetColumn[];
  onUndoTransformation?: (id: string) => void;
};

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Empty";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return String(value);
}

function getSourceMeta(transformation: DatasetTransformation) {
  if (transformation.reverted) {
    return {
      label: "Reverted",
      icon: RotateCcw,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (transformation.suggestionId === "manual-edit") {
    return {
      label: "Manual Edit",
      icon: UserPen,
      className: "border-blue-100 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "AI Applied",
    icon: Bot,
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
}

export function TransformationHistory({
  transformations,
  columns,
  onUndoTransformation,
}: Props) {
  const getColumnLabel = (field: string) => {
    return columns.find((column) => column.key === field)?.label ?? field;
  };

  if (!transformations.length) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-2">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Transformation Audit Log
            </h2>

            <p className="text-sm text-muted-foreground">
              Approved AI actions and manual corrections will appear here with
              before/after lineage.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Transformation Audit Log
            </h2>

            <p className="text-sm text-muted-foreground">
              Trace applied AI actions, manual edits, affected rows, and
              before/after values.
            </p>
          </div>
        </div>

        <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
          {transformations.length} audit events
        </div>
      </div>

      <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
        {transformations
          .slice()
          .reverse()
          .map((transformation) => {
            const source = getSourceMeta(transformation);
            const SourceIcon = source.icon;

            return (
              <article
                key={transformation.id}
                className={cn(
                  "rounded-xl border bg-background px-4 py-3 transition-colors",
                  transformation.reverted
                    ? "border-slate-200 bg-slate-50/40"
                    : "border-border"
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4 shrink-0",
                          transformation.reverted
                            ? "text-slate-500"
                            : "text-emerald-600"
                        )}
                      />

                      <h3 className="text-sm font-semibold text-foreground">
                        {transformation.suggestionTitle}
                      </h3>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          source.className
                        )}
                      >
                        <SourceIcon className="h-3 w-3" />
                        {source.label}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Action
                        </p>
                        <p className="mt-0.5 font-medium text-foreground">
                          {formatAction(transformation.action)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Affected Rows
                        </p>
                        <p className="mt-0.5 truncate font-medium text-foreground">
                          {transformation.affectedRows
                            .map((row) => `Row #${row}`)
                            .join(", ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Timestamp
                        </p>
                        <p className="mt-0.5 font-medium text-foreground">
                          {transformation.timestamp}
                        </p>
                      </div>
                    </div>

                    {transformation.changes.length > 0 && (
                      <div className="mt-3 rounded-lg border border-border bg-muted/10">
                        <div className="grid grid-cols-[1fr_1fr_24px_1fr] border-b border-border bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          <span>Field</span>
                          <span>Before</span>
                          <span />
                          <span>After</span>
                        </div>

                        <div className="divide-y divide-border/60">
                          {transformation.changes.map((change, index) => (
                            <div
                              key={`${change.rowId}-${change.field}-${index}`}
                              className="grid grid-cols-[1fr_1fr_24px_1fr] items-center gap-2 px-3 py-2 text-sm"
                            >
                              <span className="truncate font-medium text-foreground">
                                {getColumnLabel(change.field)}
                              </span>

                              <span className="truncate rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-700">
                                {formatValue(change.beforeValue)}
                              </span>

                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                              <span className="truncate rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                                {formatValue(change.afterValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {!transformation.reverted ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onUndoTransformation?.(transformation.id)
                        }
                        aria-label={`Undo transformation: ${transformation.suggestionTitle}`}
                      >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        Undo
                      </Button>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Reverted
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}