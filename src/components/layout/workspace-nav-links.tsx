"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Database, FileClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceNavLinks() {
  const params = useParams<{ datasetId?: string }>();
  const pathname = usePathname();

  const datasetId = params.datasetId ?? "sample-dataset";
  const datasetHref = `/datasets/${datasetId}`;
  const auditHref = `${datasetHref}/audit`;

  const isWorkspaceActive = pathname === datasetHref;
  const isAuditActive = pathname === auditHref;

  return (
    <nav className="hidden items-center gap-2 sm:flex">
      <Button
        asChild
        variant={isWorkspaceActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(isWorkspaceActive && "font-semibold")}
      >
        <Link href={datasetHref} aria-current={isWorkspaceActive ? "page" : undefined}>
          <Database className="mr-2 h-4 w-4" />
          Workspace
        </Link>
      </Button>

      <Button
        asChild
        variant={isAuditActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(isAuditActive && "font-semibold")}
      >
        <Link href={auditHref} aria-current={isAuditActive ? "page" : undefined}>
          <FileClock className="mr-2 h-4 w-4" />
          Audit Trail
        </Link>
      </Button>
    </nav>
  );
}