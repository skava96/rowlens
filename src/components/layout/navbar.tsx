import Link from "next/link";
import Image from "next/image";

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
          <Image
            src="/favicons/favicon.svg"
            alt="CleanFlow AI"
            width={40}
            height={40}
            className="rounded-2xl"
            priority
          />

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