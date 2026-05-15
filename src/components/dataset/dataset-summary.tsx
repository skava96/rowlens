import { DatasetWorkflowState } from "@/features/datasets/types/workflow";

type DatasetSummaryProps = {
  data: DatasetWorkflowState;
};

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

  const metrics = [
    {
      label: "Rows Processed",
      value: `${data.rows.length}`,
    },
    {
      label: "Columns Detected",
      value: "5",
    },
    {
      label: "Valid Rows",
      value: `${validRows}`,
    },
    {
      label: "Missing Values",
      value: `${missingRows}`,
    },
    {
      label: "Invalid Rows",
      value: `${invalidRows}`,
    },
    {
      label: "Workflow Status",
      value: data.status,
    },
  ];

  return (
    <section className="w-full rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Dataset Metrics</h2>
        <p className="text-sm text-muted-foreground">
          Operational overview of the uploaded dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-muted/30 p-4"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {metric.label}
            </p>

            <p className="mt-2 text-lg font-semibold text-foreground">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}