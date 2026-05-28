import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Props = {
    rowCount: number;
    onExport: () => void;
};

export default function DatasetExportSection({ rowCount, onExport }: Props) {

    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Export Ready Dataset</h2>
                    <p className="text-sm text-muted-foreground">
                        Download the currently processed dataset as a clean CSV file.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={onExport}
                    disabled={!rowCount}
                    aria-label="Export processed dataset as CSV"
                    className="rounded-full"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>
        </section>
    );
}
