import { Database, Fingerprint, Gauge, TableProperties } from "lucide-react";

import { DatasetProfile } from "@/features/datasets/utils/profileDataset";

type Props = {
  profile: DatasetProfile | null;
};

export function DatasetIntelligence({ profile }: Props) {
  if (!profile) return null;

  const averageCompleteness =
    profile.columns.length === 0
      ? 100
      : Math.round(
          profile.columns.reduce(
            (total, column) => total + column.completeness,
            0
          ) / profile.columns.length
        );

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Dataset Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Automatically inferred profile of the uploaded dataset.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-muted/20 p-2.5">
          <Database className="mb-3 h-4 w-4 text-muted-foreground" />
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Total rows
          </p>
          <p className="mt-1 text-xl font-semibold">{profile.totalRows}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-2.5">
          <TableProperties className="mb-3 h-4 w-4 text-muted-foreground" />
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Columns
          </p>
          <p className="mt-1 text-xl font-semibold">
            {profile.columns.length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-2.5">
          <Gauge className="mb-3 h-4 w-4 text-muted-foreground" />
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Completeness
          </p>
          <p className="mt-1 text-xl font-semibold">
            {averageCompleteness}%
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-2.5">
          <Fingerprint className="mb-3 h-4 w-4 text-muted-foreground" />
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Duplicate rows
          </p>
          <p className="mt-1 text-xl font-semibold">
            {profile.duplicateRows}
          </p>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-xl border border-border">
        <div className="grid grid-cols-4 items-center border-b border-border/60 px-3 py-1.5 text-sm last:border-0">
          <span>Column</span>
          <span>Type</span>
          <span>Completeness</span>
          <span>Unique values</span>
        </div>

        {profile.columns.map((column) => (
          <div
            key={column.column}
            className="grid grid-cols-4 items-center border-b border-border/60 px-3 py-1.5 text-sm last:border-0"
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
    </section>
  );
}