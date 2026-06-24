import { DatasetCellValue } from "@/types/dataset";
import { validateDatasetRow } from "./validateDatasetRow";

export function getRowValidationState(
    values: Record<string, DatasetCellValue>
): {
    validationState: "valid" | "missing" | "invalid";
    validationField?: string;
} {
    const { validationState, validationField } = validateDatasetRow(values);
    return {
        validationState,
        validationField,
    };
}
