"use client";

import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TableProperties,
} from "lucide-react";
import { toast } from "sonner";

import { useDatasetWorkflow } from "@/features/datasets/hooks/useDatasetWorkflow";
import { downloadCsv, exportDatasetToCsv } from "@/features/datasets/utils/exportDataset";

import { UploadCard } from "@/components/upload/upload-card";
import { TransformationHistory } from "@/components/dataset/transformation-history";
import DatasetExportSection from "@/features/datasets/components/dataset-export-section";
import DatasetReviewSection from "@/features/datasets/components/dataset-review-section";
import DatasetRecordsSection from "@/features/datasets/components/dataset-records-section";

import { DatasetWorkspace } from "@/features/datasets/config/dataset-registry";
import { useColumnVisibilityPreferences } from "../hooks/useColumnVisibilityPreferences";
import { cn } from "@/lib/utils";
import { useState } from "react";
import DatasetOverview from "@/components/dataset/dataset-overview";

function EmptyWorkspacePreview() {
  const capabilities = [
    {
      title: "Data validation",
      description:
        "Detect missing values, invalid formats, and inconsistent records.",
      icon: TableProperties,
      iconClass:
        "border-amber-100 bg-amber-50 text-amber-700",
    },
    {
      title: "Review workflow",
      description:
        "Approve or reject generated cleanup suggestions before export.",
      icon: Sparkles,
      iconClass:
        "border-sky-100 bg-sky-50 text-sky-700",
    },
    {
      title: "Audit history",
      description:
        "Track manual edits, suggestion decisions, and undo operations.",
      icon: ShieldCheck,
      iconClass:
        "border-violet-100 bg-violet-50 text-violet-700",
    },
    {
      title: "Clean export",
      description:
        "Download reviewed dataset outputs as CSV.",
      icon: CheckCircle2,
      iconClass:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
            Waiting for dataset
          </p>

          <h2 className="mt-2 text-lg font-semibold text-foreground">
            No dataset uploaded
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Upload a CSV or XLSX file to begin validation, review generated
            cleanup suggestions, track audit history, and export cleaned
            results.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((capability) => {
          const Icon = capability.icon;

          return (
            <div
              key={capability.title}
              className="rounded-xl border border-border bg-muted/20 p-3"
            >
              <div
                className={cn(
                  "mb-3 flex h-9 w-9 items-center justify-center rounded-lg border",
                  capability.iconClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="text-sm font-semibold text-foreground">
                {capability.title}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {capability.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type DatasetWorkspaceContainerProps = {
  workspace: DatasetWorkspace;
};

type WorkspaceTab = "overview" | "review" | "records" | "history" | "export";

export function DatasetWorkspaceContainer({
  workspace,
}: DatasetWorkspaceContainerProps) {
  const { datasetId, workspaceName } = workspace;
  const workflow = useDatasetWorkflow(datasetId);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  const columnVisibility = useColumnVisibilityPreferences({
    datasetId,
    columns: workflow.state.columns,
  });

  const isReady =
    workflow.state.status === "ready" ||
    workflow.state.status === "reviewing" ||
    workflow.state.status === "completed";

  const selectedSuggestion = workflow.state.suggestions.find(
    (suggestion) => suggestion.id === workflow.state.selectedSuggestionId
  );

  const highlightedRowIds = selectedSuggestion?.affectedRows ?? [];

  const pendingSuggestionCount = workflow.state.suggestions.filter(
    (suggestion) => suggestion.status === "pending"
  ).length;

  const workspaceTabs: {
    id: WorkspaceTab;
    label: string;
    count?: number;
  }[] = [
      {
        id: "overview",
        label: "Overview",
      },
      {
        id: "review",
        label: "Review Queue",
        count: pendingSuggestionCount,
      },
      {
        id: "records",
        label: "Records",
        count: workflow.state.rows.length,
      },
      {
        id: "history",
        label: "History",
        count: workflow.state.transformations.length,
      },
      {
        id: "export",
        label: "Export",
      },
    ];

  const handleExportCsv = () => {
    const csvContent = exportDatasetToCsv(
      workflow.state.rows,
      workflow.state.columns
    );

    downloadCsv(csvContent, "cleanflow-clean-dataset.csv");

    toast.success("Dataset exported", {
      description: `${workflow.state.rows.length} rows exported successfully.`,
    });
  };

  const handleExportSelectedRows = (rowIds: number[]) => {
    const csvContent = exportDatasetToCsv(
      workflow.state.rows.filter((row) => rowIds.includes(row.id)),
      workflow.state.columns
    );

    downloadCsv(csvContent, "cleanflow-selected-rows.csv");
  };

  const handleReviewSuggestion = (id: string) => {
    workflow.reviewSuggestion(id);
    setActiveTab("records");
  };

  const validRowCount = workflow.state.rows.filter(
    (row) => row.validationState === "valid"
  ).length;

  const invalidRowCount = workflow.state.rows.filter(
    (row) => row.validationState === "invalid"
  ).length;

  return (
    <div className="space-y-4">
      <UploadCard
        onUploadStart={workflow.startUpload}
        status={workflow.state.status}
        fileName={workflow.state.fileName}
        error={workflow.state.error}
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
        <div className="space-y-4">
          <div className="flex w-fit rounded-full border border-border bg-muted/30 p-1">
            {workspaceTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-sky-100 text-sky-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <DatasetOverview data={workflow.state} />
          )}

          {activeTab === "review" && (
            <DatasetReviewSection
              suggestions={workflow.state.suggestions}
              hasDataset={isReady}
              onReviewSuggestion={handleReviewSuggestion}
              onApproveSuggestion={workflow.approveSuggestion}
              onRejectSuggestion={workflow.rejectSuggestion}
              onClearReview={workflow.clearSelectedSuggestion}
            />
          )}

          {activeTab === "records" && (
            <div className="space-y-4">
              <DatasetRecordsSection
                columns={workflow.state.columns}
                rows={workflow.state.rows}
                visibleColumnKeys={columnVisibility.activeVisibleColumnKeys}
                columnSearchQuery={columnVisibility.columnSearchQuery}
                highlightedRowIds={highlightedRowIds}
                allColumnsVisible={columnVisibility.allColumnsVisible}
                activeVisibleColumnCount={columnVisibility.activeVisibleColumnCount}
                filteredVisibilityColumns={columnVisibility.filteredVisibilityColumns}
                visibleColumnKeySet={columnVisibility.visibleColumnKeySet}
                schemaKey={columnVisibility.schemaKey}
                workspaceName={workspaceName}
                onColumnSearchChange={columnVisibility.setColumnSearchQuery}
                onToggleColumnVisibility={columnVisibility.toggleColumnVisibility}
                onShowAllColumns={columnVisibility.showAllColumns}
                onHideAllColumns={columnVisibility.hideAllColumns}
                onUpdateCell={workflow.updateCellValue}
                onExportRows={handleExportSelectedRows}
                onBulkMarkValid={workflow.bulkMarkRowsValid}
              />

            </div>
          )}
          {activeTab === "history" && (
            <TransformationHistory
              transformations={workflow.state.transformations}
              columns={workflow.state.columns}
              onUndoTransformation={workflow.undoTransformation}
            />
          )}
          {activeTab === "export" && (
            <DatasetExportSection
              rowCount={workflow.state.rows.length}
              columnCount={workflow.state.columns.length}
              validCount={validRowCount}
              pendingSuggestionCount={pendingSuggestionCount}
              invalidCount={invalidRowCount}
              onExport={handleExportCsv}
            />
          )}
        </div>
      )}
    </div>
  );
}