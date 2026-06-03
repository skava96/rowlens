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

  const auditEvents = workflowState?.auditEvents ?? [];
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

          <p className="mt-3 text-3xl font-bold">{auditEvents.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold">Dataset Scope</p>
          </div>

          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Route-scoped workflow audit
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Workflow Audit Events</h2>

        {auditEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No workflow audit events have been recorded for this dataset yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {auditEvents
              .slice()
              .reverse()
              .map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        {event.operation}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.source} - {event.actor} - {event.status}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {event.timestamp}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.rowIds.length} affected rows
                    {event.fieldChanges?.length
                      ? ` - ${event.fieldChanges.length} field changes`
                      : ""}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>
    </>
  );
}