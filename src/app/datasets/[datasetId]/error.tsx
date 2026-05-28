"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DatasetWorkspaceError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>

        <h1 className="mt-4 text-lg font-semibold">
          Dataset workspace could not load
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Please retry loading this workspace. If the issue continues, return to
          the datasets page.
        </p>

        <Button type="button" onClick={reset} className="mt-5 rounded-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </section>
    </main>
  );
}