import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";

type Props = {
  rowCount: number;
  columnCount: number;
  validCount: number;
  pendingSuggestionCount: number;
  invalidCount: number;
  onExport: () => void;
};

export default function DatasetExportSection({
  rowCount,
  columnCount,
  validCount,
  pendingSuggestionCount,
  invalidCount,
  onExport,
}: Props) {
  const hasPendingSuggestions = pendingSuggestionCount > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="max-w-4xl">
        <h2 className="text-lg font-semibold">Export Dataset</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Download the currently processed dataset as a CSV file.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            {rowCount} rows
          </span>

          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            {columnCount} columns
          </span>

          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            {validCount} valid
          </span>

          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs text-amber-700">
            {pendingSuggestionCount} needs review
          </span>

          <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs text-red-700">
            {invalidCount} invalid
          </span>
        </div>

        {hasPendingSuggestions ? (
          <div className="mt-4 flex max-w-2xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {pendingSuggestionCount} review suggestions are still pending.
              Export is allowed, but reviewing them first is recommended.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex max-w-xl items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Dataset is ready for export. All validation reviews have been
              completed.
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={onExport}
          disabled={!rowCount}
          aria-label="Export processed dataset as CSV"
          className="mt-5 rounded-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </section>
  );
}