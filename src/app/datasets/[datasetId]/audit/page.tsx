import { FileClock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DatasetAuditPanel } from "@/features/datasets/components/dataset-audit-panel";
import { getDatasetWorkspace } from "@/features/datasets/config/dataset-registry";

type DatasetAuditPageProps = {
  params: Promise<{ datasetId: string }>;
};

export async function generateMetadata({
  params,
}: DatasetAuditPageProps): Promise<Metadata> {
  const { datasetId } = await params;

  return {
    title: `${datasetId} Audit Trail | RowLens`,
    description:
      "Review dataset activity, cleanup decisions, and change history.",
  };
}

export default async function DatasetAuditPage({
  params,
}: DatasetAuditPageProps) {
  const { datasetId } = await params;
  const workspace = getDatasetWorkspace(datasetId);

  if (!workspace) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-border bg-muted/30 p-2">
            <FileClock className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-xl font-semibold">Dataset Audit Trail</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Review cleanup decisions, manual edits, undo activity, and field
              changes for dataset:
              <span className="ml-1 font-medium text-foreground">
                {datasetId}
              </span>
            </p>
          </div>
        </div>
      </section>

      <DatasetAuditPanel datasetId={datasetId} />
    </main>
  );
}
