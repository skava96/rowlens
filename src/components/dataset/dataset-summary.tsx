import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  XCircle,
} from "lucide-react";

import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import { cn } from "@/lib/utils";

type DatasetSummaryProps = {
  data: DatasetWorkflowState;
};

function formatStatus(status: DatasetWorkflowState["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function DatasetSummary({ data }: DatasetSummaryProps) {
  const missingRows = data.rows.filter(
    (row) => row.validationState === "missing"
  ).length;

  const invalidRows = data.rows.filter(
    (row) => row.validationState === "invalid"
  ).length;

  const validRows = data.rows.filter(
    (row) => row.validationState === "valid"
  ).length;

  const reviewCount = missingRows + invalidRows;

  const metrics = [
    {
      label: "Rows",
      value: data.rows.length,
      helper: "processed",
      icon: Database,
      tone: "neutral",
    },
    {
      label: "Columns",
      value: data.columns.length,
      helper: "detected",
      icon: FileSpreadsheet,
      tone: "neutral",
    },
    {
      label: "Valid",
      value: validRows,
      helper: "ready rows",
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Needs Review",
      value: reviewCount,
      helper: "rows flagged",
      icon: AlertTriangle,
      tone: "warning",
    },
    {
      label: "Invalid",
      value: invalidRows,
      helper: "format issues",
      icon: XCircle,
      tone: "danger",
    },
  ];

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dataset Metrics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational overview of validation results.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm">
          {data.status === "uploading" || data.status === "processing" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          )}

          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium">{formatStatus(data.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-border bg-muted/20 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {metric.label}
                </p>

                <Icon
                  className={cn(
                    "h-4 w-4",
                    metric.tone === "success" && "text-emerald-600",
                    metric.tone === "warning" && "text-amber-600",
                    metric.tone === "danger" && "text-red-600",
                    metric.tone === "neutral" && "text-muted-foreground"
                  )}
                />
              </div>

              <p className="text-xl font-semibold text-foreground">
                {metric.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {metric.helper}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}