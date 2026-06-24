"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TableProperties,
} from "lucide-react";
import { toast } from "sonner";

import { useDatasetWorkflow } from "@/features/datasets/hooks/useDatasetWorkflow";
import {
  downloadCsv,
  exportDatasetToCsv,
} from "@/features/datasets/utils/exportDataset";

import { UploadCard } from "@/components/upload/upload-card";
import { TransformationHistory } from "@/components/dataset/transformation-history";
import DatasetExportSection from "@/features/datasets/components/dataset-export-section";
import DatasetReviewSection from "@/features/datasets/components/dataset-review-section";
import DatasetRecordsSection from "@/features/datasets/components/dataset-records-section";

import { DatasetWorkspace } from "@/features/datasets/config/dataset-registry";
import { useColumnVisibilityPreferences } from "../hooks/useColumnVisibilityPreferences";
import { cn } from "@/lib/utils";
import DatasetOverview from "@/components/dataset/dataset-overview";
import { DatasetAIInsightsPanel } from "../components/dataset-ai-insights-panel";
import { AIFinding } from "@/features/ai/types";

const DEMO_DATASET_FILE_NAME = "customer-cleanup-sample.csv";
const DEMO_DATASET_PATH = "/demo/customer-cleanup-sample.csv";

async function fetchDemoDatasetFile() {
  const response = await fetch(DEMO_DATASET_PATH);

  if (!response.ok) {
    throw new Error("Demo dataset could not be loaded.");
  }

  const blob = await response.blob();

  return new File([blob], DEMO_DATASET_FILE_NAME, {
    type: "text/csv",
  });
}

function EmptyWorkspacePreview({
  onLoadDemoDataset,
  isLoadingDemo,
}: {
  onLoadDemoDataset: () => void;
  isLoadingDemo: boolean;
}) {
  const capabilities = [
    {
      title: "Data validation",
      description:
        "Detect missing values, invalid formats, and inconsistent records.",
      icon: TableProperties,
      iconClass: "border-amber-100 bg-amber-50 text-amber-700",
    },
    {
      title: "Review workflow",
      description:
        "Approve or reject generated cleanup suggestions before export.",
      icon: Sparkles,
      iconClass: "border-sky-100 bg-sky-50 text-sky-700",
    },
    {
      title: "Audit history",
      description:
        "Track manual edits, suggestion decisions, and undo operations.",
      icon: ShieldCheck,
      iconClass: "border-violet-100 bg-violet-50 text-violet-700",
    },
    {
      title: "Clean export",
      description: "Download reviewed dataset outputs as CSV.",
      icon: CheckCircle2,
      iconClass: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
            Start a review
          </p>

          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Explore CleanFlow with sample customer data
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Load a prepared dataset to see the full workflow: profile the file,
            review quality suggestions, inspect affected rows, track history,
            and export a cleaned CSV.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadDemoDataset}
          disabled={isLoadingDemo}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoadingDemo ? "Loading demo..." : "Load sample workspace"}
        </button>
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

type WorkspaceTab = "overview" | "insights" | "review" | "records" | "history" | "export";

type RecordsView = "all" | "affected";

type RecordsViewIntent = {
  mode: RecordsView;
  key: string;
  suggestionId?: string;
};

export function DatasetWorkspaceContainer({
  workspace,
}: DatasetWorkspaceContainerProps) {
  const { datasetId } = workspace;
  const workflow = useDatasetWorkflow(datasetId);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab") as WorkspaceTab | null;

  const activeTab: WorkspaceTab =
    tabFromUrl &&
      ["overview", "insights", "review", "records", "history", "export"].includes(tabFromUrl)
      ? tabFromUrl
      : "overview";

  const recordsViewFromUrl: RecordsView =
    searchParams.get("recordsView") === "affected" ? "affected" : "all";

  const suggestionIdFromUrl = searchParams.get("suggestionId");

  const setActiveTab = (
    tab: WorkspaceTab,
    options?: {
      recordsView?: RecordsView;
      suggestionId?: string;
    }
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    if (tab === "records") {
      params.set("recordsView", options?.recordsView ?? "all");

      if (options?.suggestionId) {
        params.set("suggestionId", options.suggestionId);
      } else {
        params.delete("suggestionId");
      }
    } else {
      params.delete("recordsView");
      params.delete("suggestionId");
    }

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const recordsViewIntent: RecordsViewIntent = {
    mode: recordsViewFromUrl,
    suggestionId: suggestionIdFromUrl ?? undefined,
    key: `${activeTab}-${recordsViewFromUrl}-${suggestionIdFromUrl ?? "none"}`,
  };

  const columnVisibility = useColumnVisibilityPreferences({
    datasetId,
    columns: workflow.state.columns,
  });

  const isReady =
    workflow.state.status === "ready" ||
    workflow.state.status === "reviewing" ||
    workflow.state.status === "completed";

  const isLoadingDemo =
    workflow.state.status === "uploading" || workflow.state.status === "processing";

  const activeSuggestionId =
    activeTab === "records" && suggestionIdFromUrl
      ? suggestionIdFromUrl
      : workflow.state.selectedSuggestionId;

  const selectedSuggestion = workflow.state.suggestions.find(
    (suggestion) => suggestion.id === activeSuggestionId
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
        id: "insights",
        label: "AI Insights",
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

  const handleLoadDemoDataset = async () => {
    if (isLoadingDemo) return;

    try {
      const file = await fetchDemoDatasetFile();

      workflow.startUpload(file);

      toast.success("Demo dataset loading", {
        description: "Sample customer records are being prepared for review.",
      });
    } catch (error) {
      toast.error("Demo dataset unavailable", {
        description:
          error instanceof Error
            ? error.message
            : "Please try uploading your own CSV file.",
      });
    }
  };

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

  const validRowCount = workflow.state.rows.filter(
    (row) => row.validationState === "valid"
  ).length;

  const invalidRowCount = workflow.state.rows.filter(
    (row) => row.validationState === "invalid"
  ).length;

  const handleReviewSuggestion = (id: string) => {
    workflow.reviewSuggestion(id);

    setActiveTab("records", {
      recordsView: "affected",
      suggestionId: id,
    });
  };

  const handleApplySuggestion = (id: string) => {
    workflow.approveSuggestion(id);

    setActiveTab("records", {
      recordsView: "affected",
      suggestionId: id,
    });
  };

  const handleWorkspaceTabChange = (tab: WorkspaceTab) => {
    if (tab === "records") {
      workflow.clearSelectedSuggestion();
    }

    setActiveTab(tab, tab === "records" ? { recordsView: "all" } : undefined);
  };

  const onRecordsViewChange = (view: RecordsView) => {
    setActiveTab("records", {
      recordsView: view,
      suggestionId:
        view === "affected" ? recordsViewIntent.suggestionId : undefined,
    });
  };

  const handleAddAIFindingToReviewQueue = (finding: AIFinding) => {
    workflow.addAIFindingToReviewQueue(finding);

    toast.success("AI finding added to Review Queue", {
      description: "Review Queue now owns the workflow for this finding.",
    });
  };

  const handleViewSuggestionRows = (suggestionId: string) => {
    workflow.reviewSuggestion(suggestionId);

    setActiveTab("records", {
      recordsView: "affected",
      suggestionId,
    });
  };

  return (
    <div className="space-y-4">
      <UploadCard
        onUploadStart={workflow.startUpload}
        status={workflow.state.status}
        fileName={workflow.state.fileName}
        error={workflow.state.error}
        variant={isReady ? "compact" : "full"}
      />

      {workflow.state.status === "idle" && (
        <EmptyWorkspacePreview
          onLoadDemoDataset={handleLoadDemoDataset}
          isLoadingDemo={isLoadingDemo}
        />
      )}

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
            Processing dataset and preparing quality suggestions...
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
                onClick={() => handleWorkspaceTabChange(tab.id)}
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
            <div className="space-y-4">
              <DatasetOverview data={workflow.state} />
            </div>
          )}

          <div
            className={cn(
              "space-y-4",
              activeTab === "insights" ? "block" : "hidden"
            )}
          >
            <DatasetAIInsightsPanel
              state={workflow.state}
              onAddFindingToReviewQueue={handleAddAIFindingToReviewQueue}
              onViewSuggestionRows={handleViewSuggestionRows}
            />
          </div>

          {activeTab === "review" && (
            <DatasetReviewSection
              suggestions={workflow.state.suggestions}
              hasDataset={isReady}
              onReviewSuggestion={handleReviewSuggestion}
              onApproveSuggestion={handleApplySuggestion}
              onRejectSuggestion={workflow.rejectSuggestion}
            />
          )}

          {activeTab === "records" && (
            <DatasetRecordsSection
              key={columnVisibility.schemaKey}
              columns={workflow.state.columns}
              rows={workflow.state.rows}
              columnsPanel={{
                columnSearchQuery: columnVisibility.columnSearchQuery,
                filteredVisibilityColumns:
                  columnVisibility.filteredVisibilityColumns,
                visibleColumnKeySet: columnVisibility.visibleColumnKeySet,
                activePinnedColumnKeys: columnVisibility.activePinnedColumnKeys,
                maxPinnedColumns: columnVisibility.maxPinnedColumns,
                onColumnSearchChange: columnVisibility.setColumnSearchQuery,
                onToggleColumnVisibility:
                  columnVisibility.toggleColumnVisibility,
                onToggleColumnPin: columnVisibility.toggleColumnPin,
                onShowAllColumns: columnVisibility.showAllColumns,
                onHideAllColumns: columnVisibility.hideAllColumns,
              }}
              visibleColumnKeys={columnVisibility.activeVisibleColumnKeys}
              highlightedRowIds={highlightedRowIds}
              activeVisibleColumnCount={
                columnVisibility.activeVisibleColumnCount
              }
              schemaKey={columnVisibility.schemaKey}
              recordsViewIntent={recordsViewIntent}
              pinnedColumnKeys={columnVisibility.activePinnedColumnKeys}
              activeSuggestionTitle={selectedSuggestion?.title}
              activeSuggestionStatus={selectedSuggestion?.status}
              activeSuggestionResolvedRowIds={selectedSuggestion?.resolvedRows}
              onUpdateCell={workflow.updateCellValue}
              onExportRows={handleExportSelectedRows}
              onBulkMarkValid={workflow.bulkMarkRowsValid}
              onRecordsViewChange={onRecordsViewChange}
            />
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
