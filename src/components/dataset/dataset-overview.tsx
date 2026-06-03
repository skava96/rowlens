import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Fingerprint,
  Gauge,
  Loader2,
  XCircle,
} from "lucide-react";

import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import { cn } from "@/lib/utils";

type DatasetOverviewProps = {
  data: DatasetWorkflowState;
};

export default function DatasetOverview({ data }: DatasetOverviewProps) {
  const profile = data.profile;

  const invalidRows = data.rows.filter(
    (row) => row.validationState === "invalid"
  ).length;

  const validRows = data.rows.filter(
    (row) => row.validationState === "valid"
  ).length;

  const pendingSuggestionCount = data.suggestions.filter(
    (suggestion) => suggestion.status === "pending"
  ).length;

  const averageCompleteness =
    !profile || profile.columns.length === 0
      ? 100
      : Math.round(
          profile.columns.reduce(
            (total, column) => total + column.completeness,
            0
          ) / profile.columns.length
        );

  const duplicateRows = profile?.duplicateRows ?? 0;

  const metrics = [
    {
      label: "Rows",
      value: data.rows.length,
      helper: "processed",
      icon: Database,
      tone: "neutral",
      emphasis: false,
    },
    {
      label: "Columns",
      value: data.columns.length,
      helper: "detected",
      icon: FileSpreadsheet,
      tone: "neutral",
      emphasis: false,
    },
    {
      label: "Valid",
      value: validRows,
      helper: "ready rows",
      icon: CheckCircle2,
      tone: "success",
      emphasis: false,
    },
    {
      label: "Needs Review",
      value: pendingSuggestionCount,
      helper: "pending suggestions",
      icon: AlertTriangle,
      tone: "warning",
      emphasis: false,
    },
    {
      label: "Invalid",
      value: invalidRows,
      helper: "format issues",
      icon: XCircle,
      tone: "danger",
      emphasis: false,
    },
    {
      label: "Completeness",
      value: `${averageCompleteness}%`,
      helper: "profile score",
      icon: Gauge,
      tone: "success",
      emphasis: true,
    },
    {
      label: "Duplicates",
      value: duplicateRows,
      helper: "possible repeats",
      icon: Fingerprint,
      tone: duplicateRows > 0 ? "warning" : "neutral",
      emphasis: false,
    },
  ];

  const isLoading =
    data.status === "uploading" || data.status === "processing";

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dataset Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational summary and inferred profile of the uploaded dataset.
          </p>
        </div>

        {isLoading && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing dataset
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                metric.tone === "success" &&
                  "border-emerald-100 bg-emerald-50/40",
                metric.tone === "warning" &&
                  "border-amber-100 bg-amber-50/50",
                metric.tone === "danger" &&
                  "border-red-100 bg-red-50/40",
                metric.tone === "neutral" && "border-border bg-muted/20",
                metric.emphasis && "border-emerald-200 bg-emerald-50 shadow-sm"
              )}
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

              <p className="text-3xl font-bold text-foreground">
                {metric.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {metric.helper}
              </p>
            </div>
          );
        })}
      </div>

      {profile && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Column Profile</h3>
            <p className="text-xs text-muted-foreground">
              Inferred data types, completeness, and unique-value counts by
              column.
            </p>
          </div>

          <div className="max-h-[360px] overflow-auto rounded-xl border border-border">
            <div className="sticky top-0 z-10 grid grid-cols-4 items-center border-b border-border/60 bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Column</span>
              <span>Type</span>
              <span>Completeness</span>
              <span>Unique values</span>
            </div>

            {profile.columns.map((column) => (
              <div
                key={column.column}
                className="grid grid-cols-4 items-center border-b border-border/60 px-3 py-2 text-sm last:border-0"
              >
                <span className="font-medium">{column.column}</span>

                <span className="capitalize text-muted-foreground">
                  {column.inferredType}
                </span>

                <span>{column.completeness}%</span>

                <span>{column.uniqueValues}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}