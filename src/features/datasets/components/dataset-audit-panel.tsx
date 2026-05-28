"use client";

import { FileClock, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { readStoredWorkflowState } from "../workflow/workflow-storage";

type DatasetAuditPanelProps = {
  datasetId: string;
};

export function DatasetAuditPanel({ datasetId }: DatasetAuditPanelProps) {
  const workflowState = useMemo(
    () => readStoredWorkflowState(datasetId),
    [datasetId]
  );

  const transformations = workflowState?.transformations ?? [];
  const reviewedSuggestions =
    workflowState?.suggestions.filter((item) => item.status !== "pending")
      .length ?? 0;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold">Reviewed Suggestions</p>
          </div>

          <p className="mt-3 text-3xl font-bold">{reviewedSuggestions}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold">Audit Events</p>
          </div>

          <p className="mt-3 text-3xl font-bold">{transformations.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Dataset Scope</p>
          </div>

          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Route-scoped workflow audit
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Transformation Events</h2>

        {transformations.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No workflow transformations have been recorded for this dataset yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {transformations.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-muted/20 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {item.suggestionTitle}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {item.timestamp}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {item.action} · {item.affectedRows.length} affected rows ·{" "}
                  {item.changes.length} field changes
                  {item.reverted ? " · reverted" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}