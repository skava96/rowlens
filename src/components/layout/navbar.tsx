export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-8xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <span className="text-sm font-semibold">C</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">CleanFlow</span>
            <span className="text-xs text-muted-foreground">AI Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Theme toggle placeholder"
          >
            <span className="text-sm">☀️</span>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Notifications placeholder"
          >
            <span className="text-sm">🔔</span>
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="text-sm font-semibold">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
