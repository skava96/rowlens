import { Loader2, Sparkles } from "lucide-react";

export default function DatasetWorkspaceLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Loading dataset workspace</h1>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Preparing dataset records, review queue, and audit context.
        </p>
      </section>
    </main>
  );
}