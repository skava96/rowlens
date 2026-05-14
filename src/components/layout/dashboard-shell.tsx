"use client";

import { useDatasetWorkflow } from "@/features/datasets/hooks/useDatasetWorkflow";

import { UploadCard } from "@/components/upload/upload-card";
import { DatasetTable } from "@/components/dataset/dataset-table";
import DatasetSummary from "@/components/dataset/dataset-summary";
import SuggestionPanel from "@/components/ai/suggestion-panel";

export default function DashboardShell() {
  const workflow = useDatasetWorkflow();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      <UploadCard
        onUploadStart={workflow.startUpload}
        onUploadProgress={workflow.setProgress}
        onUploadComplete={workflow.completeUpload}
      />

      <DatasetSummary data={workflow.state} />

      {/* Activity */}
      <section className="rounded-3xl border p-6">
        {workflow.state.activity.map((a, i) => (
          <div key={i}>
            {a.time} - {a.label}
          </div>
        ))}
      </section>

      {/* Dataset */}
      <section className="rounded-3xl border p-6">
        <DatasetTable rows={workflow.state.rows} />
      </section>

      {/* AI */}
      <section className="rounded-3xl border p-6">
        <SuggestionPanel suggestions={workflow.state.suggestions} />
      </section>

    </div>
  );
}