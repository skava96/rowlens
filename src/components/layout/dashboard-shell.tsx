"use client";

import { useDatasetWorkflow } from "@/features/datasets/hooks/useDatasetWorkflow";

import { UploadCard } from "@/components/upload/upload-card";
import { DatasetTable } from "@/components/dataset/dataset-table";
import DatasetSummary from "@/components/dataset/dataset-summary";
import SuggestionPanel from "@/components/ai/suggestion-panel";

export default function DashboardShell() {
  const workflow = useDatasetWorkflow();

  const isReady =
    workflow.state.status === "ready" ||
    workflow.state.status === "reviewing" ||
    workflow.state.status === "completed";

  const selectedSuggestion = workflow.state.suggestions.find(
    (suggestion) => suggestion.id === workflow.state.selectedSuggestionId
  );

  const highlightedRowIds = selectedSuggestion?.affectedRows ?? [];

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <UploadCard
        onUploadStart={workflow.startUpload}
        onUploadProgress={workflow.setProgress}
        onUploadComplete={workflow.completeUpload}
      />

      {workflow.state.status === "uploading" && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <p className="text-sm font-medium">Uploading dataset...</p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${workflow.state.progress ?? 0}%` }}
            />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {workflow.state.progress ?? 0}% uploaded
          </p>
        </section>
      )}

      {workflow.state.status === "processing" && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <p className="text-sm font-medium">
            Processing dataset and generating AI suggestions...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Validating rows, detecting issues, and preparing review actions.
          </p>
        </section>
      )}

      {workflow.state.status === "failed" && (
        <section className="rounded-3xl border border-destructive/30 bg-card p-6">
          <p className="text-sm font-medium text-destructive">
            Dataset processing failed
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {workflow.state.error ?? "Please try uploading the file again."}
          </p>
        </section>
      )}

      {isReady && (
        <>
          <DatasetSummary data={workflow.state} />

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Processing Timeline
              </h2>

              <p className="text-sm text-muted-foreground">
                Real-time workflow activity for the uploaded dataset.
              </p>
            </div>

            <div className="space-y-3">
              {workflow.state.activity.map((activity, index) => {
                const isLast =
                  index === workflow.state.activity.length - 1;

                return (
                  <div
                    key={activity.id}
                    className="relative flex gap-4"
                  >
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="z-10 h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />

                      {!isLast && (
                        <div className="mt-1 h-full w-px bg-border" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {activity.label}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Dataset workflow event
                          </p>
                        </div>

                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <DatasetTable
              rows={workflow.state.rows}
              highlightedRowIds={highlightedRowIds}
            />
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <SuggestionPanel
              suggestions={workflow.state.suggestions}
              hasDataset={isReady}
              onReviewSuggestion={workflow.reviewSuggestion}
              onApproveSuggestion={workflow.approveSuggestion}
              onRejectSuggestion={workflow.rejectSuggestion}
            />
          </section>
        </>
      )}
    </div>
  );
}