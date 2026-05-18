"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Sparkles,
  TableProperties,
} from "lucide-react";

import { useDatasetWorkflow } from "@/features/datasets/hooks/useDatasetWorkflow";

import { UploadCard } from "@/components/upload/upload-card";
import { DatasetTable } from "@/components/dataset/dataset-table";
import DatasetSummary from "@/components/dataset/dataset-summary";
import SuggestionPanel from "@/components/ai/suggestion-panel";
import { DatasetIntelligence } from "@/components/dataset/dataset-intelligence";
import { TransformationHistory } from "@/components/dataset/transformation-history";

import { exportDatasetToCsv } from "@/features/datasets/utils/exportDataset";
import { Button } from "../ui/button";

function EmptyWorkspacePreview() {
  const steps = [
    {
      title: "Upload dataset",
      description: "Start with a CSV or Excel file.",
      icon: FileUp,
    },
    {
      title: "Validate records",
      description: "Detect missing values and invalid formats.",
      icon: TableProperties,
    },
    {
      title: "Review AI suggestions",
      description: "Approve or reject recommended cleaning actions.",
      icon: Sparkles,
    },
    {
      title: "Ready for export",
      description: "Prepare clean data for downstream workflows.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">How CleanFlow works</h2>
        <p className="text-sm text-muted-foreground">
          Upload a dataset to start the AI-assisted cleaning workflow.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="rounded-xl border border-border bg-muted/20 px-3 py-2"
            >
              <div className="mb-3 flex items-center justify-between">
                <Icon className="h-4 w-4 text-muted-foreground" />

                <span className="text-xs text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>

              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-muted/10 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Dataset preview</p>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
              Waiting for upload
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-4 border-b border-border bg-muted/30 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span>Name</span>
              <span>Email</span>
              <span>Country</span>
              <span>Status</span>
            </div>

            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="grid grid-cols-4 border-b border-border/60 px-3 py-2 last:border-0"
              >
                <div className="h-3 w-20 rounded-full bg-muted animate-pulse-soft" />
                <div className="h-3 w-24 rounded-full bg-muted animate-pulse-soft" />
                <div className="h-3 w-16 rounded-full bg-muted animate-pulse-soft" />
                <div className="h-3 w-14 rounded-full bg-muted animate-pulse-soft" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/10 p-3">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold">AI review preview</p>
          </div>

          <div className="space-y-2">
            {[
              "Invalid email formats",
              "Missing required fields",
              "Country standardization",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <p className="text-sm font-medium">{item}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggestions appear after dataset validation.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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

  const handleExportCsv = () => {
    exportDatasetToCsv({
      columns: workflow.state.columns,
      rows: workflow.state.rows,
      fileName: "cleanflow-clean-dataset.csv",
    });
  };

  const handleExportSelectedRows = (rowIds: number[]) => {
    exportDatasetToCsv({
      columns: workflow.state.columns,
      rows: workflow.state.rows.filter((row) => rowIds.includes(row.id)),
      fileName: "cleanflow-selected-rows.csv",
    });
  };

  return (
    <div className="space-y-4">
      <UploadCard
        onUploadStart={workflow.startUpload}
        isUploading={workflow.state.status === "uploading"}
      />

      {workflow.state.status === "idle" && <EmptyWorkspacePreview />}

      {workflow.state.status === "uploading" && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium">Uploading dataset...</p>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Dataset upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={workflow.state.progress ?? 0}
          >
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
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium">
            Processing dataset and generating AI suggestions...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Validating rows, detecting issues, and preparing review actions.
          </p>
        </section>
      )}

      {workflow.state.status === "failed" && (
        <section className="rounded-2xl border border-destructive/30 bg-card p-4 shadow-sm">
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
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Export Ready Dataset</h2>
                <p className="text-sm text-muted-foreground">
                  Download the currently processed dataset as a clean CSV file.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleExportCsv}
                disabled={!workflow.state.rows.length}
                aria-label="Export processed dataset as CSV"
                className="rounded-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

            </div>
          </section>

          <DatasetSummary data={workflow.state} />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <DatasetIntelligence profile={workflow.state.profile} />

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <SuggestionPanel
                suggestions={workflow.state.suggestions}
                hasDataset={isReady}
                onReviewSuggestion={workflow.reviewSuggestion}
                onApproveSuggestion={workflow.approveSuggestion}
                onRejectSuggestion={workflow.rejectSuggestion}
                onClearReview={workflow.clearSelectedSuggestion}
              />
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Dataset Records</h2>
                <p className="text-sm text-muted-foreground">
                  Dynamic dataset preview with validation states.
                </p>
              </div>

              <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                {workflow.state.rows.length} rows
              </span>
            </div>

            <DatasetTable
              columns={workflow.state.columns}
              rows={workflow.state.rows}
              highlightedRowIds={highlightedRowIds}
              onUpdateCell={workflow.updateCellValue}
              onExportRows={handleExportSelectedRows}
              onBulkMarkValid={workflow.bulkMarkRowsValid}
            />
          </section>

          <TransformationHistory
            transformations={workflow.state.transformations}
            columns={workflow.state.columns}
            onUndoTransformation={workflow.undoTransformation}
          />
        </>
      )}
    </div>
  );
}