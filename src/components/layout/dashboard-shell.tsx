import { DatasetWorkspaceContainer } from "@/features/datasets/containers/dataset-workspace-container";
import { DatasetWorkspace } from "@/features/datasets/config/dataset-registry";

type DashboardShellProps = {
  workspace: DatasetWorkspace;
};

export default function DashboardShell({ workspace }: DashboardShellProps) {
  return (
    <DatasetWorkspaceContainer
      workspace={workspace}
    />
  );
}