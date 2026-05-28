import { Database, FolderKanban } from "lucide-react";
import { WorkspaceBreadcrumbs } from "@/components/layout/workspace-breadcrumbs";

export default function DatasetsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-background">
            <section className="border-b border-border bg-card/40 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />

                            <h1 className="text-lg font-semibold">
                                Dataset Workspace
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Review, validate, transform, and audit uploaded datasets.
                        </p>
                    </div>

                    <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                        <FolderKanban className="h-3.5 w-3.5" />
                        Route-scoped workspace
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                <WorkspaceBreadcrumbs />
            </div>

            <div>{children}</div>
        </main>
    );
}