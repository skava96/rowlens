export type DatasetWorkspace = {
  datasetId: string;
  workspaceName: string;
  description: string;
};

export const datasetRegistry: DatasetWorkspace[] = [
  {
    datasetId: "customer-cleanup",
    workspaceName: "Customer Cleanup",
    description: "Clean and validate customer records.",
  },
  {
    datasetId: "sales-audit",
    workspaceName: "Sales Audit",
    description: "Review sales records for completeness and quality.",
  },
  {
    datasetId: "marketing-leads",
    workspaceName: "Marketing Leads",
    description: "Standardize and validate lead data.",
  },
];

export function getDatasetWorkspace(datasetId: string) {
  return datasetRegistry.find((workspace) => workspace.datasetId === datasetId);
}