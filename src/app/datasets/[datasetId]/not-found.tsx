import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DatasetNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/30">
          <Database className="h-6 w-6 text-muted-foreground" />
        </div>

        <h1 className="mt-4 text-xl font-semibold">
          Dataset workspace not found
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The requested dataset route does not exist or is no longer available.
        </p>

        <div className="mt-6">
          <Button asChild className="rounded-full">
            <Link href="/datasets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to datasets
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}