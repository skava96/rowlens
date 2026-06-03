export const DATASET_UPLOAD_CONSTRAINTS = {
  maxFileSizeMb: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxRowCount: 5000,
  acceptedExtensions: ["csv", "xlsx"] as const,
};

export function formatAcceptedExtensions() {
  return DATASET_UPLOAD_CONSTRAINTS.acceptedExtensions
    .map((extension) => extension.toUpperCase())
    .join(" or ");
}