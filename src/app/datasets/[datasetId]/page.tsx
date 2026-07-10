import DashboardShell from "@/components/layout/dashboard-shell";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDatasetWorkspace } from "@/features/datasets/config/dataset-registry";

type DatasetWorkspacePageProps = {
  params: Promise<{ datasetId: string }>;
};

export async function generateMetadata({
  params,
}: DatasetWorkspacePageProps): Promise<Metadata> {
  const { datasetId } = await params;

  const workspace = getDatasetWorkspace(datasetId);

  return {
    title: `${workspace?.workspaceName ?? "Dataset"} | RowLens`,
    description:
      workspace?.description ??
      "AI-assisted dataset review, validation, transformation, and audit workspace.",
  };
}

export default async function DatasetWorkspacePage({
  params,
}: DatasetWorkspacePageProps) {
  const { datasetId } = await params;
  const workspace = getDatasetWorkspace(datasetId);

  if (!workspace) {
    notFound();
  }

  return (
    <DashboardShell
      key={workspace.datasetId}
      workspace={workspace}
    />
  );
}