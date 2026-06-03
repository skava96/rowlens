export default function DatasetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Customer Cleanup Workspace
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Review uploaded records, approve data-quality suggestions, audit
                changes, and export cleaned CSV outputs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div>{children}</div>
    </main>
  );
}