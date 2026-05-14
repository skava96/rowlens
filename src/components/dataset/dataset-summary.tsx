import { DatasetWorkflowState } from "@/features/datasets/types/workflow";

type Props = {
  data: DatasetWorkflowState;
};

export default function DatasetSummary({ data }: Props) {
  const metrics = [
    {
      label: "Rows Processed",
      value: `${data.rows.length} rows`,
    },
    {
      label: "Columns Detected",
      value: "Auto-detected (mock)",
    },
    {
      label: "Missing Values",
      value: "Calculated later",
    },
    {
      label: "Duplicate Rows",
      value: "Calculated later",
    },
    {
      label: "Status",
      value: data.status,
    },
    {
      label: "Progress",
      value: `${data.progress}%`,
    },
  ];

  return (
    <section className="w-full rounded-xl border border-border/80 bg-card p-4 sm:p-6">
      <h2 className="text-lg font-medium mb-4">Dataset Metrics</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-gray-100 border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <p className="text-gray-500 text-xs mb-2">{metric.label}</p>
            <p className="text-gray-900 text-sm font-medium">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}