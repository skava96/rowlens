"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("RowLens route error", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
            <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/5">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>

                <h1 className="mt-4 text-lg font-semibold">
                    Workspace could not be loaded
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    RowLens ran into a problem while loading this workspace. Try again,
                    or refresh the page if the issue continues.
                </p>

                {error.digest && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        Error reference: {error.digest}
                    </p>
                )}

                <Button type="button" onClick={reset} className="mt-5 rounded-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                </Button>
            </section>
        </main>
    );
}