export default function Home() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Upload your dataset</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag files here or click upload to add new data for cleaning and preview.
            </p>
          </div>
          <button className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            Upload file
          </button>
        </div>
        <div className="mt-6 rounded-3xl border border-dashed border-border/70 bg-background/80 p-10 text-center text-sm text-muted-foreground">
          Upload area placeholder
        </div>
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dataset preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your dataset columns and row samples before processing.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Preview
          </span>
        </div>
        <div className="mt-6 overflow-hidden rounded-[28px] border border-border/70 bg-background">
          <div className="grid min-w-full grid-cols-[repeat(5,minmax(0,1fr))] gap-2 border-b border-border/70 bg-slate-50 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950">
            <span>Name</span>
            <span>Type</span>
            <span>Rows</span>
            <span>Missing</span>
            <span>Status</span>
          </div>
          <div className="space-y-2 p-4 text-sm text-foreground">
            <div className="grid min-w-full grid-cols-[repeat(5,minmax(0,1fr))] gap-2 rounded-3xl bg-slate-100 px-4 py-3 dark:bg-slate-950">
              <span>customers.csv</span>
              <span>CSV</span>
              <span>12,006</span>
              <span>1.2%</span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Ready</span>
            </div>
            <div className="grid min-w-full grid-cols-[repeat(5,minmax(0,1fr))] gap-2 rounded-3xl bg-slate-100 px-4 py-3 dark:bg-slate-950">
              <span>orders.csv</span>
              <span>CSV</span>
              <span>8,940</span>
              <span>4.5%</span>
              <span className="text-sm text-amber-600 dark:text-amber-400">Review</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">AI suggestions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore AI recommendations for cleaning, enrichment, and next steps.
            </p>
          </div>
          <button className="inline-flex items-center rounded-full border border-border/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-slate-100 dark:hover:bg-slate-900">
            Refresh
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <article className="rounded-3xl bg-background/95 p-5 shadow-sm ring-1 ring-border/60">
            <h3 className="text-base font-semibold text-foreground">Standardize address fields</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              AI suggests normalizing address data to improve matching and deduplication.
            </p>
          </article>
          <article className="rounded-3xl bg-background/95 p-5 shadow-sm ring-1 ring-border/60">
            <h3 className="text-base font-semibold text-foreground">Fill missing customer IDs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Identify rows with missing IDs and suggest inferred values from related records.
            </p>
          </article>
          <article className="rounded-3xl bg-background/95 p-5 shadow-sm ring-1 ring-border/60">
            <h3 className="text-base font-semibold text-foreground">Detect duplicate records</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Review duplicate detection suggestions to keep the dataset clean and consistent.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
