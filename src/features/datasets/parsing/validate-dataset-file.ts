import { DATASET_UPLOAD_CONSTRAINTS } from "../config/upload-constraints";

export function getDatasetFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase();
}

export function validateDatasetFile(file: File) {
  const extension = getDatasetFileExtension(file.name);

  if (
    !extension ||
    !DATASET_UPLOAD_CONSTRAINTS.acceptedExtensions.includes(
      extension as "csv" | "xlsx"
    )
  ) {
    throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
  }

  if (file.size > DATASET_UPLOAD_CONSTRAINTS.maxFileSizeBytes) {
    throw new Error(
      `File exceeds ${DATASET_UPLOAD_CONSTRAINTS.maxFileSizeMb}MB limit for this prototype.`
    );
  }
}

export function validateDatasetRowCount(rowCount: number) {
  if (rowCount > DATASET_UPLOAD_CONSTRAINTS.maxRowCount) {
    throw new Error(
      `Dataset exceeds ${DATASET_UPLOAD_CONSTRAINTS.maxRowCount} rows.`
    );
  }
}
