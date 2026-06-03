import Link from "next/link";

import { WorkspaceNavLinks } from "./workspace-nav-links";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-8xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/datasets/customer-cleanup"
          className="flex items-center gap-3"
          aria-label="Go to CleanFlow AI workspace"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700 shadow-sm">
            <span className="text-sm font-bold tracking-tight">CF</span>
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">
              CleanFlow AI
            </span>
            <span className="text-xs text-muted-foreground">
              Dataset Quality Platform
            </span>
          </div>
        </Link>

        <WorkspaceNavLinks />
      </div>
    </header>
  );
}