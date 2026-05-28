import { FileClock } from "lucide-react";
import type { Metadata } from "next";
import { DatasetAuditPanel } from "@/features/datasets/components/dataset-audit-panel";


type DatasetAuditPageProps = {
  params: Promise<{ datasetId: string }>;
};

export async function generateMetadata({
  params,
}: DatasetAuditPageProps): Promise<Metadata> {
  const { datasetId } = await params;

  return {
    title: `${datasetId} Audit Trail | CleanFlow AI`,
    description:
      "Dataset audit trail, transformation history, and review operations.",
  };
}

export default async function DatasetAuditPage({
  params,
}: DatasetAuditPageProps) {
  const { datasetId } = await params;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileClock className="h-5 w-5 text-primary" />

              <h1 className="text-xl font-semibold">
                Dataset Audit Trail
              </h1>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Review transformation history, validation actions, and AI-assisted
              cleanup decisions for dataset:
              <span className="ml-1 font-medium text-foreground">
                {datasetId}
              </span>
            </p>
          </div>

          <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            Local audit view
          </div>
        </div>
      </section>

      <DatasetAuditPanel datasetId={datasetId} />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          Audit Architecture Notes
        </h2>

        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p>
            Audit events currently originate from client-side workflow actions.
          </p>

          <p>
            Future production architecture should persist immutable
            transformation operations and dataset versions.
          </p>

          <p>
            The audit route is intentionally isolated from the dataset workspace
            route to demonstrate App Router route segmentation and future
            workspace extensibility.
          </p>
        </div>
      </section>
    </main>
  );
}