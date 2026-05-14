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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
            <h2 className="mb-4 text-lg font-semibold">Activity</h2>

            <div className="space-y-3">
              {workflow.state.activity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3"
                >
                  <span className="text-sm">{activity.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <DatasetTable rows={workflow.state.rows} />
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <SuggestionPanel
              suggestions={workflow.state.suggestions}
              hasDataset={isReady}
            />
          </section>
        </>
      )}
    </div>
  );
}