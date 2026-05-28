import Link from "next/link";
import { Bell, MoonStar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceNavLinks } from "./workspace-nav-links";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-8xl items-center justify-between px-4 sm:px-6">
        <Link href="/datasets/sample-dataset" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <span className="text-sm font-semibold">C</span>
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">
              CleanFlow
            </span>
            <span className="text-xs text-muted-foreground">AI Workspace</span>
          </div>
        </Link>

        <WorkspaceNavLinks />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled
            aria-label="Theme settings coming soon"
          >
            <MoonStar className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled
            aria-label="Notifications coming soon"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}