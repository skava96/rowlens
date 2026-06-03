"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Database, FileClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceNavLinks() {
  const params = useParams<{ datasetId?: string }>();
  const pathname = usePathname();

  const datasetId = params.datasetId ?? "customer-cleanup";
  const datasetHref = `/datasets/${datasetId}`;
  const auditHref = `${datasetHref}/audit`;

  const isWorkspaceActive = pathname === datasetHref;
  const isAuditActive = pathname === auditHref;

  return (
    <nav className="hidden items-center gap-2 sm:flex">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "border transition-colors",
          isWorkspaceActive
            ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 hover:text-sky-700"
            : "border-transparent"
        )}
      >
        <Link
          href={datasetHref}
          aria-current={isWorkspaceActive ? "page" : undefined}
        >
          <Database className="mr-2 h-4 w-4" />
          Workspace
        </Link>
      </Button>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "border transition-colors",
          isAuditActive
            ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 hover:text-sky-700"
            : "border-transparent"
        )}
      >
        <Link
          href={auditHref}
          aria-current={isAuditActive ? "page" : undefined}
        >
          <FileClock className="mr-2 h-4 w-4" />
          Audit Trail
        </Link>
      </Button>
      
    </nav>
  );
}