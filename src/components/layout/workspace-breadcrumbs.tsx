"use client";

import Link from "next/link";
import { ChevronRight, Database, FileClock, Home } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

export function WorkspaceBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams<{ datasetId?: string }>();

  const datasetId = params.datasetId;

  const isAuditRoute = pathname.includes("/audit");

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-muted"
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>

      <ChevronRight className="h-3.5 w-3.5" />

      <Link
        href="/datasets"
        className="rounded-md px-1 py-0.5 hover:bg-muted"
      >
        Datasets
      </Link>

      {datasetId && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />

          <Link
            href={`/datasets/${datasetId}`}
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-muted"
          >
            <Database className="h-3.5 w-3.5" />
            {datasetId}
          </Link>
        </>
      )}

      {isAuditRoute && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />

          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <FileClock className="h-3.5 w-3.5" />
            Audit
          </span>
        </>
      )}
    </nav>
  );
}