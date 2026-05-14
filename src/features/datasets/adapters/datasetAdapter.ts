import { DatasetRow } from "@/types/dataset";
import { mockDataset } from "@/mock/mockDataset";

export type DatasetValidationState =
  | "valid"
  | "missing"
  | "invalid";

export interface DatasetRowView extends DatasetRow {
  validationState: DatasetValidationState;
  validationField?: keyof DatasetRow;
}

function validateDatasetRow(row: DatasetRow): DatasetRowView {
  const nameMissing = !row.name?.trim();

  const signupMissing = !row.signupDate?.trim();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    row.email || ""
  );

  if (nameMissing) {
    return {
      ...row,
      validationState: "missing",
      validationField: "name",
    };
  }

  if (signupMissing) {
    return {
      ...row,
      validationState: "missing",
      validationField: "signupDate",
    };
  }

  if (!emailValid) {
    return {
      ...row,
      validationState: "invalid",
      validationField: "email",
    };
  }

  return {
    ...row,
    validationState: "valid",
  };
}

export function annotateDatasetRows(
  rows: DatasetRow[]
): DatasetRowView[] {
  return rows.map(validateDatasetRow);
}

export function loadMockDataset(): DatasetRowView[] {
  return annotateDatasetRows(mockDataset);
}